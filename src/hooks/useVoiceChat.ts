import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Haptic feedback utility
const triggerHaptic = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Vibration not supported or failed silently
    }
  }
};

export function useVoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Haptic feedback - short vibration to indicate recording started
      triggerHaptic(50);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      // Haptic feedback - error pattern
      triggerHaptic([100, 50, 100]);
      toast.error('Não foi possível aceder ao microfone');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      // Haptic feedback - double vibration to indicate recording stopped
      triggerHaptic([30, 50, 30]);

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('speech-to-text', {
                body: { audio: base64Audio },
              });
              
              if (error) throw error;
              
              if (data?.text) {
                resolve(data.text);
              } else {
                toast.error('Não foi possível transcrever o áudio');
                resolve(null);
              }
            } catch (err) {
              console.error('Transcription error:', err);
              toast.error('Erro ao transcrever áudio');
              resolve(null);
            } finally {
              setIsTranscribing(false);
            }
          };
          
        } catch (error) {
          console.error('Error processing recording:', error);
          toast.error('Erro ao processar gravação');
          setIsTranscribing(false);
          resolve(null);
        }
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    // Haptic feedback - cancel pattern
    triggerHaptic([50, 30, 50]);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  }, []);

  const speakText = useCallback(async (text: string): Promise<void> => {
    // Haptic feedback when starting/stopping speech
    triggerHaptic(30);
    
    if (isSpeaking) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text },
      });
      
      if (error) throw error;
      
      if (data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };
        
        audio.onerror = () => {
          toast.error('Erro ao reproduzir áudio');
          setIsSpeaking(false);
          audioRef.current = null;
        };
        
        await audio.play();
      } else {
        throw new Error('No audio content received');
      }
      
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Erro ao gerar áudio');
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    speakText,
    stopSpeaking,
  };
}
