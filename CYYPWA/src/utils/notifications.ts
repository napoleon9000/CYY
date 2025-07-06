export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: '/medication-icon.png',
      badge: '/medication-badge.png',
      tag: 'medication-reminder',
      requireInteraction: true,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
};

export const playSound = (type: 'gentle' | 'urgent' | 'success' = 'gentle') => {
  // Using Web Audio API to generate sounds
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch (type) {
    case 'gentle':
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      break;
    case 'urgent':
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      break;
    case 'success':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      break;
  }
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

export const vibrate = (pattern: number | number[] = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const scheduleNotification = (medication: any, reminderTime: Date) => {
  const now = new Date();
  const timeUntilReminder = reminderTime.getTime() - now.getTime();
  
  if (timeUntilReminder > 0) {
    return setTimeout(() => {
      switch (medication.notificationType) {
        case 'notification':
          showNotification(
            `Time to take ${medication.name}!`,
            {
              body: `Dosage: ${medication.dosage}`,
              data: { medicationId: medication.id }
            }
          );
          break;
        case 'sound':
          playSound('gentle');
          break;
        case 'vibration':
          vibrate();
          break;
      }
    }, timeUntilReminder);
  }
  
  return null;
};