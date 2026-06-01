const CACHE = 'mando-casa-v4';
const FILES = ['./', './index.html', './manifest.json', './icono.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
  // Medicación — notificar a la hora exacta de cada toma
  const todayStr = new Date().toISOString().split('T')[0];
  meds.forEach(m => {
    m.horas.forEach((hora, i) => {
      const [hh, mm] = hora.split(':').map(Number);
      const toma = new Date();
      toma.setHours(hh, mm, 0, 0);
      if(toma.getTime() > now){
        timers.push(setTimeout(() => {
          self.registration.showNotification('💊 Hora de la medicación', {
            body: m.nombre + ' · ' + hora,
            icon: './icono.png',
            tag: 'med-' + m.id + '-' + i,
            vibrate: [200, 100, 200, 100, 200]
            // Presupuesto — notificar el último día del mes a las 20:00
  if(presupuesto>0){
    const hoy=new Date();
    const ultimoDia=new Date(hoy.getFullYear(), hoy.getMonth()+1, 0, 20, 0, 0);
    if(ultimoDia.getTime()>now){
      const mes=hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0');
      const total=gastos.filter(g=>g.date&&g.date.startsWith(mes)).reduce((s,g)=>s+(g.importe||0),0);
      const msg=total>presupuesto
        ?'Te has pasado: '+total.toFixed(2)+'€ / '+presupuesto+'€'
        :'Has gastado '+total.toFixed(2)+'€ de '+presupuesto+'€ este mes';
      timers.push(setTimeout(()=>{
        self.registration.showNotification('📊 Resumen mensual de gastos',{
          body: msg,
          icon:'./icono.png',
          tag:'presupuesto-mes',
          vibrate:[200,100,200]
        });
      }, ultimoDia.getTime()-now));
    }
  }
});
        }, toma.getTime() - now));
      }
    });
  });
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Notificaciones programadas
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS'){
    scheduleAll(e.data.events, e.data.cumples||[], e.data.meds||[], e.data.presupuesto||0, e.data.gastos||[]);
  }
});

// Guardamos los timers activos
const timers = [];

function scheduleAll(events){
  // Limpiar timers anteriores
  timers.forEach(t => clearTimeout(t));
  timers.length = 0;

  const now = Date.now();

  events.forEach(ev => {
    const [y, m, d] = ev.date.split('-').map(Number);

    // Notificación 1 — 9:00 de la mañana del día del evento
    const at9 = new Date(y, m-1, d, 9, 0, 0).getTime();
    if(at9 > now){
      const t1 = setTimeout(() => {
        self.registration.showNotification('📅 Hoy: ' + ev.title, {
          body: ev.time ? 'A las ' + ev.time : 'Hoy es el día',
          icon: './icono.png',
          badge: './icono.png',
          tag: 'evento-manana-' + ev.title,
          vibrate: [200, 100, 200]
        });
      }, at9 - now);
      timers.push(t1);
    }

    // Notificación 2 — 1 hora antes (si tiene hora) o a las 13:00 si es 14:00 por defecto
    const hora = ev.time || '14:00';
    const [hh, mm] = hora.split(':').map(Number);
    const eventTime = new Date(y, m-1, d, hh, mm, 0).getTime();
    const oneHourBefore = eventTime - 60 * 60 * 1000;

    if(oneHourBefore > now){
      const t2 = setTimeout(() => {
        self.registration.showNotification('⏰ En 1 hora: ' + ev.title, {
          body: 'A las ' + hora,
          icon: './icono.png',
          badge: './icono.png',
          tag: 'evento-1h-' + ev.title,
          vibrate: [300, 100, 300]
        });
      }, oneHourBefore - now);
      timers.push(t2);
    }
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});
