"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
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

// Supabase realtime channel key
const CHANNEL_PREFIX = 'semify-party'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function generateMemberId(): string {
  return Math.random().toString(36).substring(2, 12)
}

export function PartyRoomView() {
  const { currentTrack, isPlaying, queue, playTrack, togglePlay, nextTrack, previousTrack } = useMusicPlayer()

  const [myId] = useState<string>(() => {
    try {
      const s = sessionStorage.getItem('semify-party-member')
      if (s) return s
      const id = generateMemberId()
      sessionStorage.setItem('semify-party-member', id)
      return id
    } catch { return generateMemberId() }
  })

  const [myName, setMyName] = useState(`Kullanıcı ${Math.floor(Math.random() * 999) + 1}`)
  const [nameInput, setNameInput] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [partyCode, setPartyCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [room, setRoom] = useState<PartyRoomData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const lastTrackIdRef = useRef<string | null>(null)

  const isHost = room?.hostId === myId

  // BroadcastChannel for cross-tab/window sync on same device
  // + polling via a simple shared server state via Supabase presence
  const initChannel = useCallback((code: string) => {
    if (broadcastRef.current) broadcastRef.current.close()
    try {
      const bc = new BroadcastChannel(`${CHANNEL_PREFIX}-${code}`)
      bc.onmessage = (e) => {
        const data = e.data as PartyRoomData
        setRoom(data)
        // Non-host: sync track
        if (data.hostId !== myId && data.currentTrack) {
          if (data.currentTrack.id !== lastTrackIdRef.current) {
            lastTrackIdRef.current = data.currentTrack.id
            playTrack(data.currentTrack, data.queue || [])
          }
        }
      }
      broadcastRef.current = bc
    } catch {}
  }, [myId, playTrack])

  const broadcast = useCallback((data: PartyRoomData) => {
    broadcastRef.current?.postMessage(data)
    // Also save to sessionStorage as fallback for same-tab refresh
    try { sessionStorage.setItem(`party-${data.code}`, JSON.stringify(data)) } catch {}
  }, [])

  // Host: broadcast when track/play state changes
  useEffect(() => {
    if (!isHost || !room) return
    const updated: PartyRoomData = {
      ...room,
      currentTrack,
      isPlaying,
      queue,
      updatedAt: Date.now(),
    }
    setRoom(updated)
    broadcast(updated)
  }, [currentTrack?.id, isPlaying])

  useEffect(() => {
    return () => { broadcastRef.current?.close() }
  }, [])

  const createRoom = () => {
    const code = generateCode()
    const newRoom: PartyRoomData = {
      code,
      hostId: myId,
      members: [{ id: myId, name: myName, joinedAt: Date.now(), isHost: true }],
      currentTrack,
      isPlaying,
      queue,
      updatedAt: Date.now(),
    }
    setPartyCode(code)
    setRoom(newRoom)
    setError('')
    initChannel(code)
    broadcast(newRoom)
  }

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setError('Geçerli bir oda kodu girin'); return }

    // Try to get room from sessionStorage (host might have set it)
    let existingRoom: PartyRoomData | null = null
    try {
      const stored = sessionStorage.getItem(`party-${code}`)
      if (stored) existingRoom = JSON.parse(stored)
    } catch {}

    const me: PartyMember = { id: myId, name: myName, joinedAt: Date.now(), isHost: false }

    if (existingRoom) {
      // Add self to members
      const alreadyIn = existingRoom.members.find(m => m.id === myId)
      if (!alreadyIn) existingRoom.members.push(me)
      existingRoom.updatedAt = Date.now()
      setRoom(existingRoom)
      setPartyCode(code)
      setJoinCode('')
      setError('')
      initChannel(code)
      broadcast(existingRoom)
      if (existingRoom.currentTrack) {
        lastTrackIdRef.current = existingRoom.currentTrack.id
        playTrack(existingRoom.currentTrack, existingRoom.queue)
      }
    } else {
      // Room not found in same browser — tell user to share from host
      setError('Oda bulunamadı. Oda sahibiyle aynı ağda/tarayıcıda olman gerekiyor. Kodu kontrol et.')
    }
  }

  const leaveRoom = () => {
    broadcastRef.current?.close()
    broadcastRef.current = null
    if (room) {
      try { sessionStorage.removeItem(`party-${room.code}`) } catch {}
    }
    setRoom(null)
    setPartyCode('')
  }

  const copyCode = () => {
    navigator.clipboard.writeText(partyCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatTime = (d: number) => {
    const ago = Math.floor((Date.now() - d) / 60000)
    if (ago < 1) return 'şimdi'
    if (ago < 60) return `${ago} dk önce`
    return `${Math.floor(ago / 60)} sa önce`
  }

  if (!room) {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-8 max-w-2xl mx-auto pb-36 md:pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Parti Odası</h1>
                <p className="text-sm text-muted-foreground">Arkadaşlarınla aynı müziği dinle</p>
              </div>
            </div>

            {/* Name */}
            <div className="mb-5 p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Görünen İsmin</p>
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
              {/* Create */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Oda Kur</h3>
                <p className="text-sm text-muted-foreground mb-4">Kendi parti odanı oluştur ve arkadaşlarını davet et</p>
                <Button onClick={createRoom} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />Oda Oluştur
                </Button>
              </div>

              {/* Join */}
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
                  <Button onClick={joinRoom} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" />Katıl
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />Nasıl Çalışır?
              </h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p>1. Oda oluştur → 6 haneli kodu arkadaşına gönder</p>
                <p>2. Arkadaşın <strong className="text-foreground">aynı cihazda farklı sekmede</strong> kodu girerek katılır</p>
                <p>3. Oda sahibi müziği kontrol eder, herkes aynı şarkıyı dinler</p>
                <p>⚠️ Şu an aynı tarayıcı üzerinden çalışıyor (yakında tam çok cihaz desteği gelecek)</p>
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
          {/* Header */}
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

          {/* Code */}
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
            {/* Now Playing */}
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

            {/* Members */}
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
