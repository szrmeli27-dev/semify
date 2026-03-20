"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  PartyPopper, Plus, LogIn, Copy, Check, Users, Music2,
  Play, Pause, SkipForward, SkipBack, Crown, X, Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const supabase = createClient()

export function PartyRoomView() {
  const { currentTrack, isPlaying, queue, playTrack, togglePlay, nextTrack, previousTrack } = useMusicPlayer()

  const [myId,          setMyId]          = useState<string>('')
  const [myName,        setMyName]        = useState('Kullanici')
  const [nameInput,     setNameInput]     = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [partyCode,     setPartyCode]     = useState('')
  const [joinCode,      setJoinCode]      = useState('')
  const [room,          setRoom]          = useState<PartyRoomData | null>(null)
  const [copied,        setCopied]        = useState(false)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

  const channelRef     = useRef<RealtimeChannel | null>(null)
  const lastTrackIdRef = useRef<string | null>(null)
  const isHostRef      = useRef(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setMyId(data.user.id)
        const name =
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          'Kullanici'
        setMyName(name)
      }
    })
  }, [])

  const isHost = room?.hostId === myId

  const subscribeToRoom = useCallback(
    (code: string, hostId: string) => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)

      const channel = supabase
        .channel('party-room-' + code)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'party_rooms', filter: 'code=eq.' + code },
          (payload) => {
            if (payload.eventType === 'DELETE') { setRoom(null); return }
            const r = payload.new as any
            setRoom((prev) => {
              const updated: PartyRoomData = {
                code: r.code,
                hostId: r.host_id,
                currentTrack: r.current_track,
                isPlaying: r.is_playing,
                queue: r.queue ?? [],
                updatedAt: new Date(r.updated_at).getTime(),
                members: prev?.members ?? [],
              }
              if (!isHostRef.current && r.current_track) {
                if (r.current_track.id !== lastTrackIdRef.current) {
                  lastTrackIdRef.current = r.current_track.id
                  playTrack(r.current_track, r.queue ?? [])
                }
              }
              return updated
            })
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'party_members', filter: 'room_code=eq.' + code },
          async () => {
            const { data } = await supabase
              .from('party_members')
              .select('user_id, display_name, joined_at')
              .eq('room_code', code)
              .order('joined_at', { ascending: true })

            if (data) {
              const members: PartyMember[] = data.map((m: any) => ({
                id: m.user_id,
                name: m.display_name,
                joinedAt: new Date(m.joined_at).getTime(),
                isHost: m.user_id === hostId,
              }))
              setRoom((prev) => (prev ? { ...prev, members } : prev))
            }
          }
        )
        .subscribe()

      channelRef.current = channel
    },
    [playTrack]
  )

  useEffect(() => {
    if (!isHost || !room || !partyCode) return
    supabase
      .from('party_rooms')
      .update({
        current_track: currentTrack,
        is_playing: isPlaying,
        queue,
        updated_at: new Date().toISOString(),
      })
      .eq('code', partyCode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, isPlaying])

  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const createRoom = async () => {
    if (!myId) return
    setLoading(true)
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

    if (roomErr) { setError('Oda olusturulamadi'); setLoading(false); return }

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
    isHostRef.current = true
    setPartyCode(code)
    setRoom(newRoom)
    setError('')
    subscribeToRoom(code, myId)
    setLoading(false)
  }

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setError('Gecerli bir oda kodu girin'); return }
    if (!myId) return
    setLoading(true)

    const { data: roomData, error: roomErr } = await supabase
      .from('party_rooms')
      .select('*')
      .eq('code', code)
      .single()

    if (roomErr || !roomData) {
      setError('Oda bulunamadi. Kodu kontrol et.')
      setLoading(false)
      return
    }

    await supabase.from('party_members').upsert({
      room_code: code,
      user_id: myId,
      display_name: myName,
    })

    const { data: membersData } = await supabase
      .from('party_members')
      .select('user_id, display_name, joined_at')
      .eq('room_code', code)
      .order('joined_at', { ascending: true })

    const members: PartyMember[] = (membersData ?? []).map((m: any) => ({
      id: m.user_id,
      name: m.display_name,
      joinedAt: new Date(m.joined_at).getTime(),
      isHost: m.user_id === roomData.host_id,
    }))

    const joinedRoom: PartyRoomData = {
      code: roomData.code,
      hostId: roomData.host_id,
      members,
      currentTrack: roomData.current_track,
      isPlaying: roomData.is_playing,
      queue: roomData.queue ?? [],
      updatedAt: new Date(roomData.updated_at).getTime(),
    }

    isHostRef.current = false
    setPartyCode(code)
    setRoom(joinedRoom)
    setJoinCode('')
    setError('')
    subscribeToRoom(code, roomData.host_id)

    if (roomData.current_track) {
      lastTrackIdRef.current = roomData.current_track.id
      playTrack(roomData.current_track, roomData.queue ?? [])
    }
    setLoading(false)
  }

  const leaveRoom = async () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = null
    if (partyCode && myId) {
      await supabase.from('party_members').delete().eq('room_code', partyCode).eq('user_id', myId)
      if (isHost) await supabase.from('party_rooms').delete().eq('code', partyCode)
    }
    setRoom(null)
    setPartyCode('')
    isHostRef.current = false
  }

  const copyCode = () => {
    navigator.clipboard.writeText(partyCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!room) {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-8 max-w-2xl mx-auto pb-36 md:pb-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Parti Odası</h1>
                <p className="text-xs text-muted-foreground">Arkadaşlarınla birlikte dinle</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-2">Görünen İsmin</p>
              {showNameInput ? (
                <div className="flex gap-2">
                  <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    placeholder="İsmin..." className="flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter' && nameInput.trim()) { setMyName(nameInput.trim()); setShowNameInput(false) } }} />
                  <Button size="sm" onClick={() => { if (nameInput.trim()) { setMyName(nameInput.trim()); setShowNameInput(false) } }}>Kaydet</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{myName}</span>
                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => { setNameInput(myName); setShowNameInput(true) }}>Değiştir</Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Oda Kur</h3>
                <p className="text-sm text-muted-foreground mb-4">Kendi parti odanı oluştur</p>
                <Button onClick={createRoom} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />{loading ? 'Oluşturuluyor...' : 'Oda Oluştur'}
                </Button>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                  <LogIn className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Odaya Katıl</h3>
                <p className="text-sm text-muted-foreground mb-4">Oda kodunu girerek katıl</p>
                <div className="space-y-2">
                  <Input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                    placeholder="ODA KODU" maxLength={6}
                    className="uppercase font-mono tracking-widest text-center text-lg font-bold"
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()} />
                  {error && <p className="text-xs text-destructive text-center">{error}</p>}
                  <Button onClick={joinRoom} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" />{loading ? 'Bağlanıyor...' : 'Katıl'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />Nasıl Çalışır?
              </h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Oda oluştur ve 6 haneli kodu arkadaşına gönder</p>
                <p>2. Arkadaşın herhangi bir cihazdan kodu girerek katılır</p>
                <p>3. Oda sahibi müziği kontrol eder, herkes aynı şarkıyı dinler</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  const members = room.members || []

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 md:p-8 max-w-3xl mx-auto pb-36 md:pb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <PartyPopper className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground">Parti Odası</h1>
                  {isHost && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      <Crown className="w-3 h-3 mr-1" />Ev Sahibi
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />{members.length} kişi
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={leaveRoom} className="text-muted-foreground hover:text-destructive">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Oda Kodu</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-[0.25em] font-mono">{partyCode}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyCode} className="gap-2 border-purple-500/30 flex-shrink-0">
                {copied ? <><Check className="w-4 h-4 text-emerald-400" />Kopyalandı</> : <><Copy className="w-4 h-4" />Kopyala</>}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Music2 className="w-4 h-4 text-primary" />Şu An Çalıyor
              </h3>
              {room.currentTrack ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <img src={room.currentTrack.thumbnail} alt={room.currentTrack.title}
                      className="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{room.currentTrack.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{room.currentTrack.artist}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={cn("w-2 h-2 rounded-full", room.isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
                        <span className="text-xs text-muted-foreground">{room.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}</span>
                      </div>
                    </div>
                  </div>
                  {isHost && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={previousTrack}><SkipBack className="w-4 h-4" /></Button>
                      <Button size="icon" className="w-10 h-10 rounded-full bg-primary text-primary-foreground" onClick={togglePlay}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={nextTrack}><SkipForward className="w-4 h-4" /></Button>
                    </div>
                  )}
                  {!isHost && <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">Müziği sadece oda sahibi kontrol edebilir</p>}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{isHost ? 'Ana ekrandan bir şarkı seç' : 'Oda sahibi şarkı seçsin...'}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />Odadaki Kişiler ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      member.isHost ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : "bg-secondary text-foreground"
                    )}>
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}{member.id === myId && <span className="ml-1 text-xs text-primary">(Sen)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(member.joinedAt)}</p>
                    </div>
                    {member.isHost && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}