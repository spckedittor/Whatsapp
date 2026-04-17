// Supabase bağlantısı
const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listeDiv = document.getElementById('arkadaslar-liste');
const aramaInput = document.getElementById('arama-input');

let benimId = localStorage.getItem('kullanici_id');
let tumArkadaslar = [];

// ==================== TEMA KONTROLÜ ====================
function temaKontrol() {
  if (localStorage.getItem('toggleState') === 'on') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

temaKontrol();
window.addEventListener('storage', () => { temaKontrol(); });

// ==================== ARKADAŞLARI GETİR ====================
async function arkadaslariGetir() {
  listeDiv.innerHTML = '<div class="yukleniyor">Yükleniyor...</div>';
  
  try {
    const { data, error } = await supabaseClient
      .from('arkadaslar')
      .select('arkadas_id, arkadas_adi')
      .eq('kullanici_id', benimId);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      tumArkadaslar = data;
      arkadaslariGoster(tumArkadaslar);
    } else {
      listeDiv.innerHTML = '<div class="yukleniyor">Henüz arkadaşınız yok.<br>Kullanıcılar sayfasından arkadaş ekleyin.</div>';
    }
  } catch (err) {
    console.error('Hata:', err);
    listeDiv.innerHTML = '<div class="yukleniyor">Arkadaşlar yüklenirken hata oluştu.</div>';
  }
}

// ==================== ARKADAŞLARI LİSTELE ====================
function arkadaslariGoster(arkadaslar) {
  if (!arkadaslar.length) {
    listeDiv.innerHTML = '<div class="yukleniyor">Arkadaş bulunamadı.</div>';
    return;
  }
  
  listeDiv.innerHTML = '';
  
  arkadaslar.forEach(ark => {
    const item = document.createElement('div');
    item.className = 'arkadas-kart';
    const renk = Math.abs(ark.arkadas_adi.charCodeAt(0) % 360);
    
    // Rastgele durum (şimdilik, sonra gerçek yapılır)
    const online = Math.random() > 0.5;
    
    item.innerHTML = `
            <div class="arkadas-avatar" style="background: hsl(${renk}, 70%, 55%);">
                ${ark.arkadas_adi.charAt(0).toUpperCase()}
            </div>
            <div class="arkadas-bilgi">
                <div class="arkadas-ad">${ark.arkadas_adi}</div>
                <div class="arkadas-durum ${online ? 'online' : 'offline'}">
                    ${online ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}
                </div>
            </div>
            <button class="arkadas-sil" data-id="${ark.arkadas_id}" data-ad="${ark.arkadas_adi}">Sil</button>
        `;
    
    // Arkadaşı sil
    const silBtn = item.querySelector('.arkadas-sil');
    silBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const onay = confirm(`${ark.arkadas_adi} arkadaşlarınızdan çıkarmak istediğinize emin misiniz?`);
      if (onay) {
        const { error } = await supabaseClient
          .from('arkadaslar')
          .delete()
          .eq('kullanici_id', benimId)
          .eq('arkadas_id', ark.arkadas_id);
        
        if (error) {
          alert('Hata: ' + error.message);
        } else {
          item.remove();
          alert(`${ark.arkadas_adi} arkadaşlarınızdan çıkarıldı!`);
          
          // Liste boşaldıysa mesaj göster
          if (listeDiv.children.length === 0) {
            listeDiv.innerHTML = '<div class="yukleniyor">Henüz arkadaşınız yok.<br>Kullanıcılar sayfasından arkadaş ekleyin.</div>';
          }
        }
      }
    });
    
    // Mesajlaşmaya git
    item.onclick = (e) => {
      if (e.target !== silBtn) {
        localStorage.setItem('mesajlasilan_kullanici', ark.arkadas_adi);
        localStorage.setItem('mesajlasilan_id', ark.arkadas_id);
        window.location.href = 'index.html';
      }
    };
    
    listeDiv.appendChild(item);
  });
}

// ==================== ARAMA ====================
if (aramaInput) {
  aramaInput.addEventListener('input', (e) => {
    const aranan = e.target.value.toLowerCase().trim();
    
    if (aranan === '') {
      arkadaslariGoster(tumArkadaslar);
    } else {
      const filtrelenen = tumArkadaslar.filter(ark =>
        ark.arkadas_adi.toLowerCase().includes(aranan)
      );
      arkadaslariGoster(filtrelenen);
    }
  });
}

// Sayfa açılınca
arkadaslariGetir();