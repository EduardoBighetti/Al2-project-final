export const notificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações Desktop.');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },
  notify: (title: string, body: string, icon = '/favicon.ico') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const notification = new Notification(title, {
      body,
      icon,
      requireInteraction: true
    });
    
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.error(e);
    }
  },
  isSupported: () => 'Notification' in window,
  hasPermission: () => 'Notification' in window && Notification.permission === 'granted',
  isEnabled: () => 'Notification' in window && Notification.permission === 'granted'
};
