"use client"

import { useState, useEffect, useCallback } from 'react'
import { useMusicPlayer } from '@/hooks/use-music-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  PartyPopper, 
  Plus, 
  LogIn, 
  Copy, 
  Check, 
  Users, 
  Music2, 
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Crown,
  X,
  Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Track } from '@/types/music'

interface PartyMember {
  id: string
  name: string
  joinedAt: number
  isHost: boolean
}

interface PartyRoom {
  code: string
  hostId: string
  members: PartyMember[]
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  queue: Track[]
  createdAt: number
}

// Simple in-memory party store simulated with localStorage events
const PARTY_KEY = 'semify-party-rooms'
const PARTY_MEMBER_KEY = 'semify-party-member'

function getRooms(): Record<string, PartyRoom> {
  try {
    return JSON.parse(localStorage.getItem(PARTY_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveRooms(rooms: Record<string, PartyRoom>) {
  localStorage.setItem(PARTY_KEY, JSON.stringify(rooms))
  window.dispatchEvent(new StorageEvent('storage', { key: PARTY_KEY }))
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateMemberId(): string {
  return Math.random().toString(36).substring(2, 12)
}

export function PartyRoomView() {
  const { currentTrack, isPlaying, queue, playTrack, togglePlay, nextTrack, previousTrack } = useMusicPlayer()
  
  const [myId] = useState<string>(() => {
    const stored = sessionStorage.getItem(PARTY_MEMBER_KEY)
    if (stored) return stored
    const id = generateMemberId()
    sessionStorage.setItem(PARTY_MEMBER_KEY, id)
    return id
  })
  
  const [myName, setMyName] = useState(() => `Kullanıcı ${Math.floor(Math.random() * 999) + 1}`)
  const [partyCode, setPartyCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [currentRoom, setCurrentRoom] = useState<PartyRoom | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)

  const isHost = currentRoom?.hostId === myId

  // Sync room state from localStorage
  const syncRoom = useCallback(() => {
    if (!partyCode) return
    const rooms = getRooms()
    const room = rooms[partyCode]
    if (!room) {
      setCurrentRoom(null)
      setPartyCode('')
      return
    }
    setCurrentRoom(room)
    
    // If not host, sync the playing state
    if (room.hostId !== myId && room.currentTrack) {
      if (room.currentTrack.id !== currentTrack?.id) {
        playTrack(room.currentTrack, room.queue)
      }
    }
  }, [partyCode, myId, currentTrack?.id, playTrack])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PARTY_KEY) syncRoom()
    }
    window.addEventListener('storage', handleStorage)
    
    // Poll every 2 seconds for same-tab updates
    const interval = setInterval(syncRoom, 2000)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [syncRoom])

  // Host: sync current playback to room
  useEffect(() => {
    if (!isHost || !partyCode) return
    const rooms = getRooms()
    if (!rooms[partyCode]) return
    
    rooms[partyCode] = {
      ...rooms[partyCode],
      currentTrack: currentTrack,
      isPlaying: isPlaying,
      queue: queue,
    }
    saveRooms(rooms)
  }, [currentTrack, isPlaying, isHost, partyCode, queue])

  const createRoom = () => {
    const code = generateCode()
    const room: PartyRoom = {
      code,
      hostId: myId,
      members: [{
        id: myId,
        name: myName,
        joinedAt: Date.now(),
        isHost: true,
      }],
      currentTrack: currentTrack,
      isPlaying: isPlaying,
      progress: 0,
      queue: queue,
      createdAt: Date.now(),
    }
    const rooms = getRooms()
    rooms[code] = room
    saveRooms(rooms)
    setPartyCode(code)
    setCurrentRoom(room)
    setError('')
  }

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setError('Lütfen bir oda kodu girin')
      return
    }
    const rooms = getRooms()
    const room = rooms[code]
    if (!room) {
      setError('Oda bulunamadı. Kodu kontrol edin.')
      return
    }
    
    // Check if already in room
    const existingMember = room.members.find(m => m.id === myId)
    if (!existingMember) {
      room.members.push({
        id: myId,
        name: myName,
        joinedAt: Date.now(),
        isHost: false,
      })
    }
    
    rooms[code] = room
    saveRooms(rooms)
    setPartyCode(code)
    setCurrentRoom(room)
    setJoinCode('')
    setError('')
    
    // Sync current track from host
    if (room.currentTrack) {
      playTrack(room.currentTrack, room.queue)
    }
  }

  const leaveRoom = () => {
    if (!partyCode) return
    const rooms = getRooms()
    const room = rooms[partyCode]
    if (room) {
      if (isHost) {
        // Host leaves: delete room
        delete rooms[partyCode]
      } else {
        room.members = room.members.filter(m => m.id !== myId)
        rooms[partyCode] = room
      }
      saveRooms(rooms)
    }
    setPartyCode('')
    setCurrentRoom(null)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(partyCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatTime = (d: number) => {
    const ago = Math.floor((Date.now() - d) / 60000)
    if (ago < 1) return 'şimdi katıldı'
    if (ago < 60) return `${ago} dk önce`
    return `${Math.floor(ago / 60)} sa önce`
  }

  // Not in a room — show create/join UI
  if (!currentRoom) {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 md:p-8 max-w-2xl mx-auto pb-36 md:pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Parti Odası</h1>
                <p className="text-sm text-muted-foreground">Arkadaşlarınla aynı müziği dinle</p>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6 p-4 rounded-xl bg-card border border-border">
              <p className="text-sm font-medium text-foreground mb-2">Görünen İsmin</p>
              {showNameInput ? (
                <div className="flex gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="İsmin..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nameInput.trim()) {
                        setMyName(nameInput.trim())
                        setShowNameInput(false)
                      }
                    }}
                  />
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (nameInput.trim()) {
                        setMyName(nameInput.trim())
                        setShowNameInput(false)
                      }
                    }}
                  >
                    Kaydet
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">{myName}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setNameInput(myName)
                      setShowNameInput(true)
                    }}
                    className="text-primary text-sm"
                  >
                    Değiştir
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Room */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Oda Kur</h3>
                <p className="text-sm text-muted-foreground mb-4">Kendi parti odanı oluştur ve arkadaşlarını davet et</p>
                <Button 
                  onClick={createRoom}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Oda Oluştur
                </Button>
              </div>

              {/* Join Room */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <LogIn className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Odaya Katıl</h3>
                <p className="text-sm text-muted-foreground mb-4">Arkadaşının gönderdiği oda koduyla katıl</p>
                <div className="space-y-2">
                  <Input
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                    placeholder="ODA KODU (ör: ABC123)"
                    className="uppercase font-mono tracking-widest text-center"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button 
                    onClick={joinRoom}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Katıl
                  </Button>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-8 p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                Nasıl Çalışır?
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>1. Oda oluştur ve oda kodunu arkadaşlarınla paylaş</p>
                <p>2. Arkadaşların kodu girerek odana katılsın</p>
                <p>3. Oda sahibi müziği kontrol eder, herkes aynı anda dinler</p>
                <p>4. Tarayıcıyı kapatmadan önce odadan çık</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // In a room
  const members = currentRoom.members || []

  return (
    <div className="flex-1 h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 md:p-8 max-w-3xl mx-auto pb-36 md:pb-8">
          {/* Room Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">Parti Odası</h1>
                  {isHost && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Ev Sahibi
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {members.length} kişi dinliyor
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={leaveRoom}
              className="text-muted-foreground hover:text-destructive"
              title="Odadan Ayrıl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Room Code */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Oda Kodu — Arkadaşlarına gönder</p>
                <p className="text-3xl font-bold text-foreground tracking-[0.25em] font-mono">{partyCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-2 border-purple-500/30 hover:border-purple-500/60"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-emerald-400" /> Kopyalandı</>
                ) : (
                  <><Copy className="w-4 h-4" /> Kopyala</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Now Playing */}
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Music2 className="w-4 h-4 text-primary" />
                Şu An Çalıyor
              </h3>
              
              {currentRoom.currentTrack ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <img
                      src={currentRoom.currentTrack.thumbnail}
                      alt={currentRoom.currentTrack.title}
                      className="w-14 h-14 rounded-lg object-cover shadow-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {currentRoom.currentTrack.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {currentRoom.currentTrack.artist}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          currentRoom.isPlaying ? "bg-primary animate-pulse" : "bg-muted-foreground"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {currentRoom.isPlaying ? 'Çalıyor' : 'Duraklatıldı'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Host controls */}
                  {isHost && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={previousTrack}
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={nextTrack}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {!isHost && (
                    <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
                      Müziği sadece oda sahibi kontrol edebilir
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Music2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz şarkı çalmıyor</p>
                  {isHost && (
                    <p className="text-xs mt-1">Ana ekrandan bir şarkı seç</p>
                  )}
                </div>
              )}
            </div>

            {/* Members */}
            <div className="p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Odadaki Kişiler ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      member.isHost 
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" 
                        : "bg-secondary text-foreground"
                    )}>
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}
                        {member.id === myId && (
                          <span className="ml-1 text-xs text-primary">(Sen)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(member.joinedAt)}</p>
                    </div>
                    {member.isHost && (
                      <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Queue */}
          {currentRoom.queue && currentRoom.queue.length > 0 && (
            <div className="mt-4 p-5 rounded-xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-3">Sıradaki Şarkılar ({currentRoom.queue.length})</h3>
              <div className="space-y-1">
                {currentRoom.queue.slice(0, 5).map((track, i) => (
                  <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg">
                    <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
                {currentRoom.queue.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{currentRoom.queue.length - 5} şarkı daha
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
