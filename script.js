// script.js - Giriş sayfası için
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cvmwprfzsfqpeqmthjfe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bXdwcmZ6c2ZxcGVxbXRoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjkxMzAsImV4cCI6MjA5MTUwNTEzMH0.w041DWrkIHmab2bXhSYYBly0ZouT_YaJcFXrYta70GA';

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elementleri
const loginBtn = document.querySelector('#loginBtn');
const usernameInput = document.querySelector('.name');
const passwordInput = document.querySelector('.password');
const rememberCheckbox = document.getElementById('rememberMe');

// Giriş yapma fonksiyonu
async function girisYap() {
  const girilenIsim = usernameInput.value.trim();
  const sifre = passwordInput.value.trim();
  
  if (!girilenIsim || !sifre) {
    alert('Lütfen kullanıcı adı ve şifre girin');
    return;
  }
  
  // Email formatı oluştur (kullanıcı adı@sohbetapp.com)
  const email = girilenIsim + '@sohbetapp.com';
  
  const { data, error } = await window.supabase.auth.signInWithPassword({
    email: email,
    password: sifre
  });
  
  if (error) {
    alert('Giriş hatası: ' + error.message);
    console.error(error);
  } else {
    // Kullanıcı bilgilerini kaydet
    localStorage.setItem('kullanici_adi', girilenIsim);
    localStorage.setItem('kullanici_id', data.user.id);
    localStorage.setItem('remember', rememberCheckbox.checked ? 'evet' : 'hayir');
    
    console.log('Giriş başarılı:', girilenIsim);
    console.log('Yönlendiriliyor...');
    
    // Ana sayfaya yönlendir
    window.location.href = 'index.html';
  }
}

// Remember me kontrolü
if (localStorage.getItem('remember') === 'evet') {
  rememberCheckbox.checked = true;
  const kayitliKullanici = localStorage.getItem('kullanici_adi');
  if (kayitliKullanici) {
    usernameInput.value = kayitliKullanici;
  }
}

// Buton olayı
if (loginBtn) {
  loginBtn.addEventListener('click', girisYap);
} else {
  // Eğer id ile bulamazsa class ile dene
  const classBtn = document.querySelector('.buton');
  if (classBtn) classBtn.addEventListener('click', girisYap);
}

// Enter tuşu ile giriş
if (passwordInput) {
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') girisYap();
  });
}