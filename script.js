// Sayfadaki tüm elementler (HTML kodları) tam olarak yüklendiğinde bu bloğun içindekiler çalışmaya başlar.
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 🛒 1. SEPET (SHOPPING CART) MANTIĞI
    // ==========================================
    
    // Sepetle etkileşime geçecek HTML elemanlarını yakalıyoruz
    const cartIconBtn = document.getElementById('cart-icon-btn'); // Menüdeki sepet butonu
    const cartSidebar = document.getElementById('cart-sidebar'); // Sağdan kayarak açılacak menü
    const cartOverlay = document.getElementById('cart-overlay'); // Sepet açılınca arkayı karartan katman
    const closeCartBtn = document.getElementById('close-cart-btn'); // Sepeti kapatma (X) butonu
    const cartItemsContainer = document.getElementById('cart-items-container'); // Ürünlerin sıralanacağı boşluk
    const cartTotalPrice = document.getElementById('cart-total-price'); // 0 TL yazan toplam fiyat kısmı
    const cartCountElement = document.querySelector('.cart-count'); // İkon üstündeki küçük sayı kutucuğu
    const addToCartButtons = document.querySelectorAll('.btn-add-cart'); // Ürünlerin altındaki "Sepete Ekle" butonları

    // Tarayıcı hafızasını kontrol et: Daha önceden eklenmiş ürün varsa al, yoksa boş dizi '[]' yarat
    let cart = JSON.parse(localStorage.getItem('shoppingCart') || '[]');

    // Sepet menüsünü açıp kapatmaya yarayan temel fonksiyon
    const toggleCart = () => {
        if(!cartSidebar) return;
        cartSidebar.classList.toggle('active'); // CSS dosyamızdaki kaydırma animasyonunu tetikler
        cartOverlay.classList.toggle('active'); // Arka planı karartır
    };

    // Sepet ikonuna veya çarpıya basıldığında toggleCart fonksiyonunu çalıştır
    if(cartIconBtn) cartIconBtn.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if(cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    // "2.450 TL" gibi metinsel fiyatları, matematik hesabı yapabilmek için "2450" şekline dönüştüren araç
    const parsePrice = (priceStr) => {
        return parseInt(priceStr.replace(/[^0-9]/g, ''));
    };

    // Sepetteki ürünleri dinamik olarak HTML'e dönüştürüp ekrana çizen asıl fonksiyon
    const renderCart = () => {
        if(!cartItemsContainer) return;
        cartItemsContainer.innerHTML = ''; // Her çizimden önce eski listeyi temizle
        let total = 0; // Toplam fiyata 0'dan başla
        let count = 0; // Toplam ürün adetine 0'dan başla

        // Sepet tamamen boşsa:
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: #6b7280; margin-top: 20px;">Sepetiniz boş.</p>';
            cartCountElement.textContent = '0';
            cartTotalPrice.textContent = '0 TL';
            return;
        }

        // Sepette ürün varsa hepsini tek tek dön ve ekrana bas
        cart.forEach(item => {
            const itemTotal = parsePrice(item.price) * item.quantity; // Ürün adetiyle fiyatı çarp (Örn: 2 x 750)
            total += itemTotal; // Sepetin genel toplamına ekle
            count += item.quantity; // İkonun üzerindeki genel sayıya ekle

            // Ürünün sepette nasıl görüneceğini belirleyen HTML şablonu (Resim, İsim, Adet butonları)
            const cartItemHTML = `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: contain; margin-right: 15px;">
                    <div class="cart-item-details" style="flex-grow: 1;">
                        <div class="cart-item-title" style="font-weight: bold;">${item.name}</div>
                        <div class="cart-item-price" style="color: #8b5cf6;">${item.price}</div>
                        <div class="cart-item-controls" style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                            <button onclick="updateCartQuantity('${item.id}', -1)" style="width: 25px; height: 25px; cursor: pointer;">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity('${item.id}', 1)" style="width: 25px; height: 25px; cursor: pointer;">+</button>
                        </div>
                    </div>
                    <!-- Çöp kutusu ikonu, basıldığında ürünü tamamen siler -->
                    <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; color: red; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML); // Hazırlanan HTML'i sepet boşluğuna fırlat
        });

        cartCountElement.textContent = count; // İkondaki sayıyı güncelle
        cartTotalPrice.textContent = total.toLocaleString('tr-TR') + ' TL'; // 2450 sayısını "2.450 TL" olarak yazdır
    };

    // "+" veya "-" butonlarına basıldığında adeti artıran/azaltan fonksiyon
    window.updateCartQuantity = (id, change) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id); // Adet 0'a inerse ürünü sepetten çıkar
            }
            localStorage.setItem('shoppingCart', JSON.stringify(cart)); // Değişikliği kalıcı olarak tarayıcıya kaydet
            renderCart(); // Ekranı yenile
        }
    };

    // Çöp kutusuyla ürünü direkt çöpe atma
    window.removeFromCart = (id) => {
        cart = cart.filter(i => i.id !== id); // Seçilen ürünü dışlayıp geri kalanları tutar
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        renderCart();
    };

    // Anasayfadaki Sepete Ekle butonlarının görevleri
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Sayfanın en yukarı kaymasını engeller
            const card = this.closest('.product-card'); // Tıklanan butona sahip olan ürün kartını bulur
            
            // Karttan ürünün adını, ID'sini ve resmini çeker
            const product = {
                id: card.getAttribute('data-product-id'),
                name: card.getAttribute('data-product-name'),
                img: card.getAttribute('data-product-img'),
                price: card.getAttribute('data-product-price'),
                quantity: 1
            };

            // Eğer bu klavye/mouse sepette daha önceden eklendiyse yeni satır açmak yerine sadece adeti 1 artır
            const existingItem = cart.find(i => i.id === product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(product); // Yeni ürünse sepet listesine ekle
            }

            localStorage.setItem('shoppingCart', JSON.stringify(cart)); // Kaydet
            renderCart(); // Ekrana çiz

            // Kullanıcı sepete eklendiğini anlasın diye butonun rengini ve yazısını 1.5 saniyeliğine değiştirir
            const originalText = this.textContent;
            this.textContent = 'Eklendi!';
            this.style.backgroundColor = '#8b5cf6';
            this.style.color = 'white';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = 'transparent';
                this.style.color = '#8b5cf6';
            }, 1500);

            // Ürün eklendiğinde eğer sepet paneli kapalıysa otomatik olarak sağdan açılarak listeyi gösterir
            if(!cartSidebar.classList.contains('active')) {
                toggleCart();
            }
        });
    });

    renderCart(); // Sayfa yüklendiğinde eski kalıntıları silip sepeti temiz çizer


    // ==========================================
    // 🔐 2. GİRİŞ YAP & KAYIT OL (KULLANICI SİSTEMİ)
    // ==========================================
    
    // HTML'deki form kutularını yakalıyoruz
    const userBtn = document.getElementById('user-btn'); 
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.getElementById('close-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const userNameDisplay = document.getElementById('user-name-display');
    const userDropdown = document.getElementById('user-dropdown');
    const adminPanelLink = document.getElementById('admin-panel-link');
    const navLogoutBtn = document.getElementById('nav-logout-btn');

    // Siteye girildiğinde kişinin daha önce oturum açıp açmadığını denetler
    const checkLoginState = () => {
        const loggedInUser = sessionStorage.getItem('userName'); // İsmi hafızadan getir
        const isAdmin = sessionStorage.getItem('isAdmin') === 'true'; // Bu kişi admin mi diye bak

        if (loggedInUser && userNameDisplay && userDropdown) {
            // BAŞARILI GİRİŞ: İkonun yanına kullanıcının ismini (sadece ilk adını) yazdır
            userNameDisplay.textContent = loggedInUser.split(' ')[0];
            userNameDisplay.style.display = 'inline';
            if(isAdmin && adminPanelLink) adminPanelLink.style.display = 'block'; // Admin ise paneli göster
            loadFavorites(); // Giriş yapanın kendi özel kalplerini (favorilerini) getir
        } else if (userNameDisplay && userDropdown) {
            // GİRİŞ YOK: İsmi sakla, menüyü gizle, favori kalpleri temizle
            userNameDisplay.style.display = 'none';
            userDropdown.classList.remove('active');
            clearFavoritesUI();
        }
    };

    // Kalpleri ekrandan silen yardımcı fonksiyon (kırmızıdan griye çevirir)
    const clearFavoritesUI = () => {
        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.classList.remove('active');
            const icon = btn.querySelector('i');
            if(icon) {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    };

    // Tarayıcıya önceden kaydettiğimiz favori ürünleri (kırmızı kalpleri) yeniden boyayan fonksiyon
    const loadFavorites = () => {
        const userEmail = sessionStorage.getItem('userEmail');
        if(!userEmail) return; // Giriş yapmadıysa iptal et
        
        const favorites = JSON.parse(localStorage.getItem(`favorites_${userEmail}`) || '[]');
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.getAttribute('data-product-id');
            const favBtn = card.querySelector('.btn-favorite');
            if(!favBtn) return;
            const icon = favBtn.querySelector('i');
            
            // Eğer ekrandaki ürün ID'si kullanıcının favorilerinde varsa kalbi kırmızı yap (fas = dolu)
            if(favorites.some(f => f.id === productId)) {
                favBtn.classList.add('active');
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                favBtn.classList.remove('active');
                icon.classList.remove('fas');
                icon.classList.add('far'); // far = boş
            }
        });
    };
    checkLoginState(); // Sayfa yüklendiğinde oturumu kontrol et

    // Navbar'daki kullanıcı (Adam) ikonuna tıklandığında
    if(userBtn) {
        userBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (sessionStorage.getItem('userName')) {
                // Giriş yapıldıysa kişinin ismine özel açılır (dropdown) menüyü aç
                userDropdown.classList.toggle('active');
            } else {
                // Giriş yapılmadıysa ortadan "Kayıt/Giriş" penceresini (Modal) fırlat
                authModal.classList.add('active');
            }
        });
    }

    // Profil menüsünden "Çıkış Yap"a basıldığında oturumu kapat
    if(navLogoutBtn) {
        navLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('isAdmin');
            checkLoginState();
            window.location.href = 'index.html'; // Anasayfaya yolla
        });
    }

    // Modalın sağ üstündeki Çarpı butonuna basınca modalı gizle
    if(closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    // Giriş Yap ve Kayıt Ol sekmeleri (Tab) arasında tıklandıkça geçiş yapma animasyonları
    if(tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            formLogin.classList.add('active');
            formSignup.classList.remove('active');
        });
        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            formSignup.classList.add('active');
            formLogin.classList.remove('active');
        });
    }

    // Alt kısımda çıkan yeşil/kırmızı mesajları (Başarılı, Hatalı şifre vs) yazdıran mini asistan
    const showMessage = (msg, isError = false) => {
        const authMessage = document.getElementById('auth-message');
        if(!authMessage) return;
        authMessage.textContent = msg;
        authMessage.style.display = 'block';
        authMessage.style.color = isError ? '#ef4444' : '#10b981'; // Hata ise kırmızı, başarılıysa yeşil
    };

    // ==========================================
    // 🌐 3. BACKEND (PYTHON API) BAĞLANTILARI
    // ==========================================

    // GİRİŞ YAPMA FORMU: "Giriş Yap" butonuna tıklandığında Python Sunucusuna haber gönderir
    if(formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // Sayfanın yenilenmesini engeller
            
            // Kutucuklardaki yazıları al
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                // VERİTABANI BAĞLANTISI (Live Server ile uyumlu kesin adres)
                const response = await fetch('http://localhost:8082/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json(); // Sunucudan gelen cevabı dinle
                
                if(response.ok) {
                    showMessage(data.message, false); // Giriş başarılı yazdır
                    
                    // Python'un bize verdiği verileri (İsim, Admin yetkisi vs.) tarayıcı hafızasına güvenle kaydet
                    sessionStorage.setItem('userName', data.user_name);
                    sessionStorage.setItem('userEmail', data.user_email);
                    sessionStorage.setItem('isAdmin', data.is_admin);
                    
                    // 1 saniye bekleyip modalı kapat ve ismi yukarıya yazdır (checkLoginState sayesinde)
                    setTimeout(() => {
                        authModal.classList.remove('active');
                        formLogin.reset(); // Kutuların içini sil
                        document.getElementById('auth-message').style.display = 'none';
                        checkLoginState();
                    }, 1000);
                } else {
                    showMessage(data.detail, true); // Eğer şifre veya mail yanlışsa kırmızı hata mesajı bastır
                }
            } catch (err) {
                showMessage('Sunucu kapalı. Lütfen Python sunucusunu çalıştırın.', true); // Eğer python main.py açılmadıysa çıkacak hata
            }
        });
    }

    // KAYIT OLMA FORMU: "Kayıt Ol" butonuna tıklandığında Python Sunucusuna kullanıcıyı yollar
    if(formSignup) {
        formSignup.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // HTML'den birebir uyuşan yeni kimlikleri çekiyoruz! (reg-name, reg-email, reg-password)
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                // Yeni kullanıcıyı oluşturması için Python'daki /api/register adresine verileri fırlatıyoruz
                const response = await fetch('http://localhost:8082/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if(response.ok) {
                    showMessage(data.message, false); // "Kayıt başarıyla oluşturuldu"
                    
                    setTimeout(() => {
                        // 1.5 saniye sonra kullanıcıyı yormamak için otomatik olarak "Giriş Yap" sekmesine kaydır
                        tabLogin.click();
                        document.getElementById('auth-message').style.display = 'none';
                        formSignup.reset(); // Kayıt formunu temizle
                    }, 1500);
                } else {
                    showMessage(data.detail, true); // Eğer e-posta daha önce alınmışsa hata fırlatır
                }
            } catch (err) {
                showMessage('Sunucu kapalı. Lütfen Python sunucusunu çalıştırın.', true);
            }
        });
    }

    // ==========================================
    // ❤️ 4. FAVORİYE EKLE (KALP) İŞLEMLERİ
    // ==========================================
    
    // Ürünlerdeki tüm kalp butonlarını bul
    const favoriteBtns = document.querySelectorAll('.btn-favorite');
    favoriteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userEmail = sessionStorage.getItem('userEmail');
            
            // Eğer adam giriş yapmadan kalbe basarsa sert yap: Modalı suratına aç ve uyar!
            if(!userEmail) {
                alert('Favorilere eklemek için önce giriş yapmalısınız.');
                authModal.classList.add('active');
                return;
            }

            // Tıklanan kalbin bulunduğu ürünü komple yakala
            const card = e.target.closest('.product-card');
            const product = {
                id: card.getAttribute('data-product-id'),
                name: card.getAttribute('data-product-name'),
                img: card.getAttribute('data-product-img'),
                price: card.getAttribute('data-product-price')
            };

            // O anki giriş yapan kişiye (Mail adresine) özel tarayıcıda bir klasör (favori listesi) yarat veya var olanı aç
            let favorites = JSON.parse(localStorage.getItem(`favorites_${userEmail}`) || '[]');
            
            // Bu klavye zaten bizim favorilerimizde var mı kontrol et
            const existingIndex = favorites.findIndex(f => f.id === product.id);
            if(existingIndex > -1) {
                // Kalbe 2. kez tıklıyordur. Yani vazgeçti. Ürünü favorilerden kopar at (Çıkar).
                favorites.splice(existingIndex, 1);
            } else {
                // İlk defa tıkladı. Ürünü sevdi, listeye ekle.
                favorites.push(product);
            }
            
            // Güncellenen listeyi tekrar tarayıcıya çivile ve kalpleri doğru renklere boyaması için loadFavorites'ı çağır
            localStorage.setItem(`favorites_${userEmail}`, JSON.stringify(favorites));
            loadFavorites();
        });
    });

});
