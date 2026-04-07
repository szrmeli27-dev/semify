"use client"

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Track } from '@/types/music'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PartyMember {
  id: string
  name: string
  joinedAt: number
  isHost: boolean
}

interface PartyRoomData {
  code: string
  hostId: string
  members: PartyMember[]
  currentTrack: Track | null
  isPlaying: boolean
  queue: Track[]
  updatedAt: number
}

interface PartyRoomState {
  room: PartyRoomData | null
  partyCode: string
  myId: string
  myName: string
  loading: boolean
  error: string
  channel: RealtimeChannel | null

  setMyId: (id: string) => void
  setMyName: (name: string) => void
  createRoom: (currentTrack: Track | null, isPlaying: boolean, queue: Track[]) => Promise<void>
  joinRoom: (code: string, playTrack: (track: Track, queue: Track[]) => void) => Promise<void>
  leaveRoom: () => Promise<void>
  syncToRoom: (currentTrack: Track | null, isPlaying: boolean, queue: Track[]) => void
  setError: (error: string) => void
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const supabase = createClient()

export const usePartyRoom = create<PartyRoomState>()((set, get) => ({
  room: null,
  partyCode: '',
  myId: '',
  myName: 'Kullanıcı',
  loading: false,
  error: '',
  channel: null,

  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  setError: (error) => set({ error }),

  createRoom: async (currentTrack, isPlaying, queue) => {
    const { myId, myName } = get()
    if (!myId) return
    set({ loading: true, error: '' })

    const code = generateCode()

    const { error: roomErr } = await supabase.from('party_rooms').insert({
      code,
      host_id: myId,
      host_name: myName,
      current_track: currentTrack,
      is_playing: isPlaying,
      queue,
      updated_at: new Date().toISOString(),
    })

    if (roomErr) { set({ error: 'Oda oluşturulamadı', loading: false }); return }

    await supabase.from('party_members').insert({
      room_code: code,
      user_id: myId,
      display_name: myName,
    })

    const newRoom: PartyRoomData = {
      code,
      hostId: myId,
      members: [{ id: myId, name: myName, joinedAt: Date.now(), isHost: true }],
      currentTrack,
      isPlaying,
      queue,
      updatedAt: Date.now(),
    }

    const channel = supabase
      .channel('party-room-' + code)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_rooms', filter: 'code=eq.' + code }, (payload) => {
        if (payload.eventType === 'DELETE') { set({ room: null, partyCode: '' }); return }
        const r = payload.new as any
        set((s) => ({
          room: s.room ? {
            ...s.room,
            currentTrack: r.current_track,
            isPlaying: r.is_playing,
            queue: r.queue ?? [],
            updatedAt: new Date(r.updated_at).getTime(),
          } : null
        }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: 'room_code=eq.' + code }, async () => {
        const { data } = await supabase.from('party_members').select('user_id, display_name, joined_at').eq('room_code', code).order('joined_at', { ascending: true })
        if (data) {
          const members: PartyMember[] = data.map((m: any) => ({
            id: m.user_id, name: m.display_name, joinedAt: new Date(m.joined_at).getTime(), isHost: m.user_id === get().room?.hostId,
          }))
          set((s) => ({ room: s.room ? { ...s.room, members } : null }))
        }
      })
      .subscribe()

    set({ room: newRoom, partyCode: code, channel, loading: false })
  },

  joinRoom: async (joinCode, playTrack) => {
    const { myId, myName } = get()
    const code = joinCode.trim().toUpperCase()
    if (!myId || code.length < 4) { set({ error: 'Geçerli bir oda kodu girin' }); return }
    set({ loading: true, error: '' })

    const { data: roomData, error: roomErr } = await supabase.from('party_rooms').select('*').eq('code', code).single()
    if (roomErr || !roomData) { set({ error: 'Oda bulunamadı', loading: false }); return }

    await supabase.from('party_members').upsert({ room_code: code, user_id: myId, display_name: myName })

    const { data: membersData } = await supabase.from('party_members').select('user_id, display_name, joined_at').eq('room_code', code).order('joined_at', { ascending: true })
    const members: PartyMember[] = (membersData ?? []).map((m: any) => ({
      id: m.user_id, name: m.display_name, joinedAt: new Date(m.joined_at).getTime(), isHost: m.user_id === roomData.host_id,
    }))

    const joinedRoom: PartyRoomData = {
      code: roomData.code, hostId: roomData.host_id, members,
      currentTrack: roomData.current_track, isPlaying: roomData.is_playing,
      queue: roomData.queue ?? [], updatedAt: new Date(roomData.updated_at).getTime(),
    }

    const channel = supabase
      .channel('party-room-' + code)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_rooms', filter: 'code=eq.' + code }, (payload) => {
        if (payload.eventType === 'DELETE') { set({ room: null, partyCode: '' }); return }
        const r = payload.new as any
        // Misafir için şarkıyı senkronize et
        if (r.current_track && r.current_track.id !== get().room?.currentTrack?.id) {
          playTrack(r.current_track, r.queue ?? [])
        }
        set((s) => ({
          room: s.room ? {
            ...s.room,
            currentTrack: r.current_track,
            isPlaying: r.is_playing,
            queue: r.queue ?? [],
            updatedAt: new Date(r.updated_at).getTime(),
          } : null
        }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: 'room_code=eq.' + code }, async () => {
        const { data } = await supabase.from('party_members').select('user_id, display_name, joined_at').eq('room_code', code).order('joined_at', { ascending: true })
        if (data) {
          const members: PartyMember[] = data.map((m: any) => ({
            id: m.user_id, name: m.display_name, joinedAt: new Date(m.joined_at).getTime(), isHost: m.user_id === roomData.host_id,
          }))
          set((s) => ({ room: s.room ? { ...s.room, members } : null }))
        }
      })
      .subscribe()

    if (roomData.current_track) playTrack(roomData.current_track, roomData.queue ?? [])
    set({ room: joinedRoom, partyCode: code, channel, loading: false })
  },

  leaveRoom: async () => {
    const { channel, partyCode, myId, room } = get()
    if (channel) supabase.removeChannel(channel)
    if (partyCode && myId) {
      await supabase.from('party_members').delete().eq('room_code', partyCode).eq('user_id', myId)
      if (room?.hostId === myId) await supabase.from('party_rooms').delete().eq('code', partyCode)
    }
    set({ room: null, partyCode: '', channel: null })
  },

  syncToRoom: (currentTrack, isPlaying, queue) => {
    const { partyCode, room, myId } = get()
    if (!partyCode || !room || room.hostId !== myId) return
    supabase.from('party_rooms').update({
      current_track: currentTrack,
      is_playing: isPlaying,
      queue,
      updated_at: new Date().toISOString(),
    }).eq('code', partyCode)
  },
}))
