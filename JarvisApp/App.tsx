import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Mic, MicOff, Settings, MessageSquare, Volume2, Activity,
  HardDrive, Clock, Zap, Shield, ChevronUp, Trash2, Cpu, Maximize
} from 'lucide-react';

const isWeb = Platform.OS === 'web';

const THEME = {
  primary: '#00d4ff',
  secondary: '#0055ff',
  surfaceLight: 'rgba(255, 255, 255, 0.03)',
  surfaceMedium: 'rgba(255, 255, 255, 0.08)',
  surfaceDark: 'rgba(0, 0, 0, 0.6)',
  accent: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.15)',
  borderHighlight: 'rgba(0, 212, 255, 0.4)',
};

const glassStyle = isWeb ? {
  backdropFilter: 'blur(20px) saturate(150%)',
  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
} as any : {};

const heavyGlassStyle = isWeb ? {
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
} as any : {};

const holoRingStyle = isWeb ? {
  boxShadow: '0px 0px 30px rgba(0, 212, 255, 0.9), inset 0px 0px 25px rgba(0, 212, 255, 0.7), 0px 0px 10px rgba(255,255,255,1)',
  transformStyle: 'preserve-3d',
} as any : {};

const dormantRingStyle = isWeb ? {
  boxShadow: '0px 0px 10px rgba(0, 212, 255, 0.3), inset 0px 0px 5px rgba(0, 212, 255, 0.1)',
  transformStyle: 'preserve-3d',
} as any : {};

interface ChatMessage {
  type: 'user' | 'jarvis';
  text: string;
  time: string;
}

const COMMAND_CATEGORIES = [
  { icon: '🖥️', title: 'SYSTEM', commands: ["system status", "cpu usage", "memory", "battery", "uptime"] },
  { icon: '📱', title: 'APPS', commands: ["open chrome", "open notepad", "close chrome", "open whatsapp"] },
  { icon: '📁', title: 'FILES', commands: ["list desktop files", "search for file", "create folder"] },
  { icon: '🔊', title: 'AUDIO', commands: ["volume up", "volume down", "mute", "max volume"] },
  { icon: '💡', title: 'DISPLAY', commands: ["brightness 50%", "screen resolution"] },
  { icon: '🌐', title: 'NETWORK', commands: ["my ip address", "wifi status"] },
  { icon: '🔍', title: 'SEARCH', commands: ["google something", "play on youtube", "search pinterest for"] },
  { icon: '🎵', title: 'MEDIA', commands: ["pause", "next track", "previous track"] },
  { icon: '📋', title: 'CLIPBOARD', commands: ["what's copied", "copy hello world"] },
  { icon: '⚡', title: 'POWER', commands: ["shutdown", "restart", "sleep", "lock screen"] },
  { icon: '🗑️', title: 'CLEANUP', commands: ["empty recycle bin"] },
  { icon: '🏗️', title: 'PROCESSES', commands: ["running processes"] },
  { icon: '📸', title: 'CAPTURE', commands: ["take a screenshot"] },
];

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('ONLINE');
  const [uiMode, setUiMode] = useState<'normal' | 'combat'>('normal');
  const [manualInput, setManualInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);


  // Core visual animations for Arc Reactor 3D rotation
  const rotateXAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const rotateZAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  // Extremely smooth, slow, methodical continuous rotation for 3D Iron Man core
  useEffect(() => {
    Animated.loop(Animated.timing(rotateXAnim, { toValue: 1, duration: 22000, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(rotateYAnim, { toValue: 1, duration: 18000, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(rotateZAnim, { toValue: 1, duration: 28000, useNativeDriver: false })).start();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('LISTENING...');
      };
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        processCommand(text);
      };
      recognitionRef.current.onerror = (e: any) => {
        if (e.error !== 'no-speech') setStatus('ONLINE');
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const statsInterval = setInterval(async () => {
      try {
        const resp = await fetch('http://localhost:7475/api/system');
        const data = await resp.json();
        setSystemStats(data);
      } catch (e) {
        console.error("Failed to fetch system stats", e);
      }
    }, 3000);

    return () => clearInterval(statsInterval);
  }, []);

  // Breathing Pulse (Faster when listening)
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        ])
      ).start();
    } else {
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: false }).start();
    }
  }, [isListening]);

  const getNow = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const startListening = () => {
    try { recognitionRef.current?.start(); } catch { }
  };
  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { }
  };

  const handleHelloPress = () => {
    if (isListening) {
      stopListening();
    } else {
      setStatus('SPEAKING...');
      const utterance = new SpeechSynthesisUtterance("Hello sir, how can I help you?");
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(v => v.lang.includes('GB') || v.name.includes('UK') || v.name.includes('British'));
      if (ukVoice) utterance.voice = ukVoice;
      utterance.pitch = uiMode === 'combat' ? 0.75 : 0.9;
      utterance.rate = 1.05;
      utterance.onend = () => {
        try { recognitionRef.current?.start(); } catch { }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = async (text: string) => {
    setStatus('PROCESSING...');
    setChatHistory(prev => [...prev, { type: 'user', text, time: getNow() }]);

    try {
      const resp = await fetch('http://localhost:7475/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();

      setChatHistory(prev => [...prev, { type: 'jarvis', text: data.response, time: getNow() }]);

      if (data.mode === 'combat') setUiMode('combat');
      else if (text.toLowerCase().includes('stand down') || text.toLowerCase().includes('normal mode')) setUiMode('normal');

      speak(data.response);
    } catch {
      const txt = "My server connection failed, sir.";
      setChatHistory(prev => [...prev, { type: 'jarvis', text: txt, time: getNow() }]);
      speak(txt);
      setStatus('ONLINE');
    }
  };

  const speak = (text: string) => {
    setStatus('SPEAKING...');

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(v => v.lang.includes('GB') || v.name.includes('UK') || v.name.includes('British'));
    if (ukVoice) utterance.voice = ukVoice;
    utterance.pitch = uiMode === 'combat' ? 0.75 : 0.9;
    utterance.rate = 1.05;

    utterance.onend = () => {
      setStatus('ONLINE');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processCommand(manualInput);
      setManualInput('');
    }
  };

  // Interpolations for 3D Arc Reactor Animation
  const spinX = rotateXAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinY = rotateYAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinZ = rotateZAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinXReverse = rotateXAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const spinYReverse = rotateYAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const currentHue = uiMode === 'combat' ? THEME.accent : THEME.primary;

  // Render logic...
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── HEADER (Glass) ─── */}
      <View style={[styles.header]}>
        <View style={styles.headerLeft}>
          {systemStats && (
            <View style={[styles.sysBadge, glassStyle, { borderColor: currentHue }]}>
              <Activity size={14} color={currentHue} />
              <Text style={[styles.sysBadgeText, { color: currentHue }]}>
                CPU: {systemStats.cpu.usage.toFixed(1)}% | RAM: {systemStats.memory.usedPercent.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowCommands(!showCommands)} style={[styles.cmdBtn, heavyGlassStyle, { borderColor: THEME.border }]}>
            <Settings color={currentHue} size={16} />
            <Text style={[styles.cmdBtnText, { color: currentHue }]}>SYSTEM COMMANDS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── COMMANDS DATABASE OVERLAY ─── */}
      {showCommands && (
        <Animated.View style={[styles.overlayPanel, glassStyle, { borderColor: currentHue, position: 'absolute', top: 80, right: 20, width: 350, zIndex: 50, maxHeight: '80%' }]}>
          <Text style={styles.overlayTitle}>CAPABILITIES DATABASE</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {COMMAND_CATEGORIES.map((cat, i) => (
                <View key={i} style={[styles.commandBlock, glassStyle]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: THEME.text, marginBottom: 8, fontFamily: 'Inter' }}>
                    {cat.icon} {cat.title}
                  </Text>
                  {cat.commands.map((cmd, j) => (
                    <Text key={j} style={{ color: THEME.textSecondary, fontSize: 12, marginBottom: 3, fontFamily: 'JetBrains Mono' }}>• {cmd}</Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ─── IRON MAN ARC REACTOR STAGE ─── */}
      <View style={[styles.arcReactorContainer, isWeb ? { perspective: '800px', transformStyle: 'preserve-3d' } as any : {}]}>
        {/* Core Radiance Glow */}
        <Animated.View style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: 90, backgroundColor: currentHue, filter: 'blur(60px)', opacity: status === 'SPEAKING...' ? 1 : 0.4 } as any,
          { transform: [{ scale: pulseAnim }] }
        ]} />

        {/* Outer Glowing Ring */}
        <Animated.View style={[styles.arcRing, status === 'SPEAKING...' ? holoRingStyle : dormantRingStyle, {
          width: 190, height: 190, borderRadius: 95, borderWidth: 2, borderColor: status === 'SPEAKING...' ? 'rgba(0, 212, 255, 1)' : 'rgba(0, 212, 255, 0.4)',
          transform: [{ rotateX: '65deg' }, { rotateY: spinY }, { rotateZ: spinZ }]
        }]} />

        {/* Middle Glowing Ring (Counter-Rotating) */}
        <Animated.View style={[styles.arcRing, status === 'SPEAKING...' ? holoRingStyle : dormantRingStyle, {
          width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: status === 'SPEAKING...' ? '#fff' : 'rgba(0, 212, 255, 0.3)', borderStyle: 'dotted',
          transform: [{ rotateX: spinXReverse }, { rotateY: '65deg' }, { rotateZ: spinZ }]
        }]} />

        {/* Inner Glowing Ring */}
        <Animated.View style={[styles.arcRing, status === 'SPEAKING...' ? holoRingStyle : dormantRingStyle, {
          width: 110, height: 110, borderRadius: 55, borderWidth: 6, borderColor: status === 'SPEAKING...' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 212, 255, 0.2)',
          transform: [{ rotateX: spinYReverse }, { rotateY: spinX }, { rotateZ: '45deg' }]
        }]} />

        {/* Solid Core Drop center */}
        <Animated.View style={[styles.arcCore, {
          backgroundColor: status === 'SPEAKING...' ? '#ffffff' : '#00d4ff',
          transform: [{ scale: pulseAnim }],
          ...(isWeb && status === 'SPEAKING...' ? { boxShadow: `0 0 50px ${currentHue}, 0 0 100px ${currentHue}, inset 0 0 20px #fff` } : { boxShadow: `0 0 20px ${currentHue}` }) as any
        }]} />
      </View>

      <Text style={[styles.jarvisBrand, { color: currentHue }]}>J.A.R.V.I.S.</Text>

      {/* ─── LIVE SYSTEM MONITOR (Left Sidebar) ─── */}
      {systemStats && (
        <View style={[styles.sideStats, heavyGlassStyle, { borderColor: currentHue }]}>
          <View style={styles.statRow}>
            <Cpu size={16} color={currentHue} />
            <View style={{ flex: 1 }}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>CORE LOAD</Text>
                <Text style={[styles.statValue, { color: currentHue }]}>{systemStats.cpu.usage.toFixed(1)}%</Text>
              </View>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarFill, { width: `${systemStats.cpu.usage}%`, backgroundColor: currentHue }]} />
              </View>
            </View>
          </View>

          <View style={styles.statRow}>
            <Activity size={16} color={currentHue} />
            <View style={{ flex: 1 }}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>MEMORY</Text>
                <Text style={[styles.statValue, { color: currentHue }]}>{systemStats.memory.usedPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarFill, { width: `${systemStats.memory.usedPercent}%`, backgroundColor: currentHue }]} />
              </View>
            </View>
          </View>

          <View style={styles.statRow}>
            <HardDrive size={16} color={currentHue} />
            <View style={{ flex: 1 }}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>DISK</Text>
                <Text style={[styles.statValue, { color: currentHue }]}>{systemStats.disk.usedPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.statBarBg}>
                <View style={[styles.statBarFill, { width: `${systemStats.disk.usedPercent}%`, backgroundColor: currentHue }]} />
              </View>
            </View>
          </View>

          {systemStats.battery && (
            <View style={styles.statRow}>
              <Zap size={16} color={currentHue} />
              <View style={{ flex: 1 }}>
                <View style={styles.statLabelRow}>
                  <Text style={styles.statLabel}>POWER</Text>
                  <Text style={[styles.statValue, { color: currentHue }]}>{systemStats.battery.percent}% {systemStats.battery.isCharging ? '▲' : ''}</Text>
                </View>
                <View style={styles.statBarBg}>
                  <View style={[styles.statBarFill, { width: `${systemStats.battery.percent}%`, backgroundColor: currentHue }]} />
                </View>
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: THEME.border }]} />

          <View style={styles.miniInfo}>
            <Text style={styles.miniInfoText}>UPTIME: {Math.floor(systemStats.uptime / 3600)}H {Math.floor((systemStats.uptime % 3600) / 60)}M</Text>
            <Text style={styles.miniInfoText}>USER: {systemStats.user.toUpperCase()}</Text>
            <Text style={styles.miniInfoText}>HOST: {systemStats.hostname.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Hello Jarvis Trigger Button */}
      <View style={styles.triggerContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.helloButton, heavyGlassStyle, { borderColor: THEME.borderHighlight }]}
          onPress={handleHelloPress}
        >
          {isListening ? (
            <MicOff color={currentHue} size={20} style={{ marginRight: 8 }} />
          ) : (
            <Mic color={currentHue} size={20} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.helloButtonText, { color: currentHue }]}>
            {isListening ? 'LISTENING...' : 'HELLO JARVIS'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.statusLabel}>{status}</Text>
      </View>

      {/* ─── CHAT AREA ─── */}
      <View style={styles.chatSection}>
        <ScrollView
          ref={chatScrollRef}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {chatHistory.map((msg, idx) => {
            const isUser = msg.type === 'user';
            return (
              <View key={idx} style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.bubble, isUser ? [styles.userBubble, glassStyle] : [styles.jarvisBubble, glassStyle, uiMode === 'combat' && { borderColor: THEME.accent }]]}>
                  <View style={styles.bubbleHeader}>
                    {!isUser && <Volume2 size={10} color={currentHue} />}
                    <Text style={styles.bubbleTime}>{msg.time}</Text>
                  </View>
                  <Text style={[styles.bubbleMsg, { color: isUser ? THEME.text : THEME.text }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* ─── FOOTER INPUT (Glass) ─── */}
      <View style={styles.footer}>
        <View style={[styles.inputBox, heavyGlassStyle]}>
          <TextInput
            style={[styles.input, { fontFamily: 'Inter' }]}
            placeholder="Type manually if needed..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualSubmit}
          />
          <TouchableOpacity onPress={handleManualSubmit} style={[styles.sendBtn, { backgroundColor: currentHue }]}>
            <ChevronUp color="#000" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row' },
  cmdBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, backgroundColor: THEME.surfaceMedium,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
  },
  cmdBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: 'Inter' },
  sysBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 15, borderWidth: 1, backgroundColor: THEME.surfaceLight
  },
  sysBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'JetBrains Mono' },

  sideStats: {
    position: 'absolute', left: 20, top: 120, width: 220,
    backgroundColor: THEME.surfaceMedium, borderRadius: 20,
    padding: 15, borderWidth: 1, zIndex: 10,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statLabel: { color: THEME.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statValue: { fontSize: 10, fontWeight: '700', fontFamily: 'JetBrains Mono' },
  statBarBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 2 },
  divider: { height: 1, marginVertical: 10 },
  miniInfo: { gap: 4 },
  miniInfoText: { color: THEME.textSecondary, fontSize: 8, fontWeight: '600', letterSpacing: 1, fontFamily: 'JetBrains Mono' },

  // System/Command Panels
  overlayPanel: {
    backgroundColor: THEME.surfaceMedium,
    borderRadius: 20, padding: 20, borderWidth: 1,
  },
  overlayTitle: { color: THEME.text, fontSize: 11, fontWeight: '600', letterSpacing: 2, fontFamily: 'Inter', marginBottom: 12 },
  commandBlock: { width: '100%', backgroundColor: THEME.surfaceLight, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: THEME.border },

  // Center Arc Reactor Stage
  arcReactorContainer: {
    alignItems: 'center', justifyContent: 'center',
    height: 180, marginTop: 10, alignSelf: 'center', width: 180,
  },
  arcRing: {
    position: 'absolute',
    justifyContent: 'center', alignItems: 'center',
  },
  arcCore: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20,
  },

  jarvisBrand: {
    alignSelf: 'center', fontSize: 28, letterSpacing: 10,
    fontWeight: '300', fontFamily: 'Inter', marginTop: 10,
    textShadowColor: 'rgba(0, 212, 255, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15
  },

  triggerContainer: { alignItems: 'center', marginVertical: 15 },
  helloButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingVertical: 16, borderRadius: 40,
    borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20,
  },
  helloButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 3, fontFamily: 'Inter' },
  statusLabel: { color: THEME.textSecondary, fontSize: 11, fontWeight: '500', letterSpacing: 2, marginTop: 10, fontFamily: 'Inter' },

  // Chat
  chatSection: { flex: 1, paddingHorizontal: 20 },
  chatContent: { paddingVertical: 10 },

  bubbleWrapper: { width: '100%', marginBottom: 14 },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 20, borderWidth: 1
  },
  userBubble: { backgroundColor: 'rgba(0, 212, 255, 0.1)', borderColor: 'rgba(0, 212, 255, 0.3)', borderBottomRightRadius: 4 },
  jarvisBubble: { backgroundColor: THEME.surfaceMedium, borderColor: THEME.border, borderBottomLeftRadius: 4 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  bubbleTime: { color: THEME.textSecondary, fontSize: 10, fontFamily: 'Inter' },
  bubbleMsg: { fontSize: 15, lineHeight: 22 },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12, paddingBottom: 30 },
  inputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: THEME.border,
    borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 15
  },
  input: { flex: 1, fontSize: 16, color: THEME.text, outlineStyle: 'none' as any },
  sendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

export default App;
