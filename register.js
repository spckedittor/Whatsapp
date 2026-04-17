// register.js - Kayıt sayfası için
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elementleri
const signBtn = document.querySelector('.buton');
const usernameInput = document.querySelector('.name');
const passwordInputs = document.querySelectorAll('.password');
const rememberCheckbox = document.getElementById('rememberMe');

// Kayıt olma fonksiyonu
async function kayitOl() {
  const kullaniciAdi = usernameInput.value.trim();
  const sifre = passwordInputs[0].value.trim();
  const sifreTekrar = passwordInputs[1]?.value.trim();
  
  if (!kullaniciAdi || !sifre) {
    alert('Lütfen kullanıcı adı ve şifre girin');
    return;
  }
  
  if (sifre !== sifreTekrar) {
    alert('Şifreler eşleşmiyor!');
    return;
  }
  
  if (sifre.length < 6) {
    alert('Şifre en az 6 karakter olmalı');
    return;
  }
  
  // Email formatı oluştur (kullanıcı adı@sohbetapp.com)
  const email = kullaniciAdi + '@sohbetapp.com';
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: sifre,
    options: {
      data: {
        kullanici_adi: kullaniciAdi,
        display_name: kullaniciAdi
      }
    }
  });
  
  if (error) {
    alert('Kayıt hatası: ' + error.message);
    console.error(error);
  } else {
    // Kullanıcıyı kullanicilar tablosuna ekle
    if (data && data.user) {
      const { error: insertError } = await supabase
        .from('kullanicilar')
        .upsert({
          id: data.user.id,
          kullanici_adi: kullaniciAdi,
          email: email
        });
      
      if (insertError) {
        console.error('Tablo ekleme hatası:', insertError);
      }
    }
    
    alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
    window.location.href = 'g1.html';
  }
}

// Kayıt butonuna tıkla
if (signBtn) signBtn.addEventListener('click', kayitOl);

// Enter tuşu ile kayıt
passwordInputs[1]?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') kayitOl();
});