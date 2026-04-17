// Supabase bağlantısı
const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listeDiv = document.getElementById('sohbetler-listesi');
let benimId = localStorage.getItem('kullanici_id');

// Tema kontrolü
function temaKontrol() {
  if (localStorage.getItem('toggleState') === 'on') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

temaKontrol();
window.addEventListener('storage', () => { temaKontrol(); });

// Son mesajları formatla
function formatZaman(tarih) {
  if (!tarih) return '';
  const date = new Date(tarih);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 604800000) {
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  }
}

// Mesaj tipine göre gösterim
function mesajOzeti(mesaj) {
  if (mesaj.tip === 'foto') return '📷 Fotoğraf';
  if (mesaj.tip === 'dosya') return '📄 Dosya';
  return mesaj.mesaj_icerik || '';
}

// Arkadaşları ve son mesajlarını getir
async function sohbetleriGetir() {
  listeDiv.innerHTML = '<div class="yukleniyor">Yükleniyor...</div>';
  
  try {
    // 1. Arkadaş listesini al
    const { data: arkadaslar, error: arkadasHata } = await supabaseClient
      .from('arkadaslar')
      .select('arkadas_id, arkadas_adi')
      .eq('kullanici_id', benimId);
    
    if (arkadasHata) throw arkadasHata;
    
    if (!arkadaslar || arkadaslar.length === 0) {
      listeDiv.innerHTML = '<div class="yukleniyor">Henüz arkadaşınız yok.<br>Kullanıcılar sayfasından arkadaş ekleyin.</div>';
      return;
    }
    
    // 2. Her arkadaş için son mesajı bul
    const arkadasIdleri = arkadaslar.map(a => a.arkadas_id);
    
    const { data: mesajlar, error: mesajHata } = await supabaseClient
      .from('spckedittorsapi')
      .select('*')
      .in('kullanici_id', arkadasIdleri)
      .order('gonderim_tarihi', { ascending: false });
    
    if (mesajHata) throw mesajHata;
    
    // 3. Her arkadaş için en son mesajı bul
    const sonMesajlar = {};
    if (mesajlar) {
      mesajlar.forEach(m => {
        if (!sonMesajlar[m.kullanici_id]) {
          sonMesajlar[m.kullanici_id] = m;
        }
      });
    }
    
    // 4. Liste oluştur
    listeDiv.innerHTML = '';
    
    arkadaslar.forEach(ark => {
      const sonMesaj = sonMesajlar[ark.arkadas_id];
      const renk = Math.abs(ark.arkadas_adi.charCodeAt(0) % 360);
      
      const item = document.createElement('div');
      item.className = 'sohbet-item';
      
      item.innerHTML = `
                <div class="avatar" style="background: hsl(${renk}, 70%, 55%);">
                    ${ark.arkadas_adi.charAt(0).toUpperCase()}
                </div>
                <div class="sohbet-info">
                    <div class="sohbet-header">
                        <span class="sohbet-isim">${ark.arkadas_adi}</span>
                        <span class="sohbet-zaman">${formatZaman(sonMesaj?.gonderim_tarihi)}</span>
                    </div>
                    <div class="sohbet-sonmesaj">
                        ${sonMesaj ? mesajOzeti(sonMesaj) : 'Henüz mesaj yok'}
                    </div>
                </div>
            `;
      
      item.onclick = () => {
        localStorage.setItem('mesajlasilan_kullanici', ark.arkadas_adi);
        localStorage.setItem('mesajlasilan_id', ark.arkadas_id);
        window.location.href = 'index.html';
      };
      
      listeDiv.appendChild(item);
    });
    
  } catch (err) {
    console.error('Hata:', err);
    listeDiv.innerHTML = '<div class="yukleniyor">Sohbetler yüklenirken hata oluştu.</div>';
  }
}

// Sayfa açılınca
sohbetleriGetir();