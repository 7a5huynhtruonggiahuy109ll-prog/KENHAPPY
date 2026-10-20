(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const slides = $$('.slide');
  const dots = $$('.scene-dot');
  const totalSlides = slides.length;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentIndex = 0;
  let toastTimer = null;
  let messageReturnFocus = null;
  let editorReturnFocus = null;
  let petalEnabled = true;
  let isPointerDown = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  const STORAGE = {
    letter: 'flowerJourney20_10_letter_v1',
    photos: 'flowerJourney20_10_photos_v1',
    petal: 'flowerJourney20_10_petals_v1'
  };

  const wishes = [
    { label: 'LỜI CHÚC BÌNH YÊN', name: 'Bình yên như nắng sớm', text: 'Mong những ngày của bạn luôn bắt đầu bằng một điều đáng mong chờ và kết thúc bằng cảm giác bình yên. Dù ngoài kia có bận rộn đến đâu, hãy luôn dành cho mình một khoảng trời dịu dàng.' },
    { label: 'LỜI CHÚC NIỀM VUI', name: 'Niềm vui ở những điều nhỏ', text: 'Chúc bạn có thật nhiều lý do để mỉm cười: một tách trà vừa thơm, một lời hỏi han đúng lúc, một người sẵn lòng lắng nghe và những khoảnh khắc bé nhỏ khiến lòng mình ấm lên.' },
    { label: 'LỜI CHÚC ƯỚC MƠ', name: 'Ước mơ cứ thế nở hoa', text: 'Chúc mọi ước mơ bạn đang ấp ủ đều có cơ hội được lớn lên. Mong bạn đủ can đảm để bắt đầu, đủ kiên trì để đi tiếp và luôn tin rằng mình xứng đáng với những điều tốt đẹp.' },
    { label: 'LỜI CHÚC YÊU THƯƠNG', name: 'Được thương theo cách xứng đáng', text: 'Mong bạn được yêu thương bằng sự chân thành, được tôn trọng trong những lựa chọn và được lắng nghe cả trong những ngày không biết phải nói gì. Bạn không cần trở nên hoàn hảo để xứng đáng được yêu.' },
    { label: 'LỜI CHÚC DÀNH CHO BẠN', name: 'Dịu dàng với chính mình', text: 'Đừng quên dành cho bản thân sự dịu dàng mà bạn vẫn dành cho người khác. Nghỉ ngơi khi mệt, tự hào về những bước tiến nhỏ và nhớ rằng chỉ cần bạn vẫn đang cố gắng, như thế đã rất đáng quý rồi.' }
  ];

  const messageCards = {
    mother: {
      kicker: 'GỬI MẸ',
      title: 'Mẹ là bình yên của con',
      body: 'Nhân ngày 20/10, con mong mẹ luôn khỏe mạnh, an yên và có thật nhiều niềm vui cho riêng mình. Cảm ơn mẹ vì bao ngày âm thầm yêu thương, vì luôn là nơi con có thể trở về. Mong những điều tốt đẹp mẹ trao đi sẽ quay lại với mẹ bằng thật nhiều dịu dàng.'
    },
    teacher: {
      kicker: 'GỬI CÔ GIÁO',
      title: 'Cảm ơn người gieo mầm',
      body: 'Kính chúc cô luôn mạnh khỏe, hạnh phúc và giữ mãi ngọn lửa yêu nghề. Cảm ơn cô vì không chỉ trao kiến thức mà còn gieo vào chúng em niềm tin, lòng kiên nhẫn và động lực để trưởng thành. Mong mỗi ngày đứng lớp của cô đều nhận lại thật nhiều yêu thương.'
    },
    friend: {
      kicker: 'GỬI NHỮNG NGƯỜI BẠN',
      title: 'Mong bạn luôn rực rỡ',
      body: 'Chúc bạn luôn có đủ tự tin để sống theo cách mình tin là đúng, đủ mạnh mẽ khi gặp thử thách và đủ thảnh thơi để tận hưởng những điều bình thường. Mong bên cạnh bạn luôn có người thật lòng, và trong tim bạn luôn có một điều khiến mình háo hức mỗi sáng.'
    },
    self: {
      kicker: 'GỬI CHÍNH MÌNH',
      title: 'Bạn cũng xứng đáng được thương',
      body: 'Mong bạn học cách tự hào về chính mình, kể cả khi con đường chưa hoàn toàn như mong đợi. Bạn được phép chậm lại, được phép thay đổi và được phép bắt đầu lại. Hãy chăm sóc trái tim mình tử tế như cách bạn vẫn chăm sóc những người mình yêu quý.'
    }
  };

  function safeRead(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value, failureMessage = 'Không thể lưu dữ liệu trên trình duyệt này.') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast(failureMessage);
      return false;
    }
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function goTo(index, focusSlide = false) {
    const nextIndex = Math.max(0, Math.min(totalSlides - 1, Number(index)));
    if (!Number.isFinite(nextIndex)) return;
    if (nextIndex === currentIndex) return;
    const oldIndex = currentIndex;
    if (oldIndex === 4 && nextIndex !== 4) closeEditor(false);
    currentIndex = nextIndex;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === currentIndex);
      slide.classList.toggle('is-before', i < currentIndex);
      slide.setAttribute('aria-hidden', i === currentIndex ? 'false' : 'true');
      if (i === currentIndex) {
        slide.removeAttribute('inert');
      } else {
        slide.setAttribute('inert', '');
      }
      if (i === currentIndex) {
        const reveal = $$('.reveal-item', slide);
        reveal.forEach((item) => {
          item.style.animation = 'none';
          // Restart only the entrance animation without delaying navigation.
          void item.offsetWidth;
          item.style.animation = '';
        });
      }
    });

    dots.forEach((dot, i) => {
      const selected = i === currentIndex;
      dot.classList.toggle('is-active', selected);
      if (selected) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });

    document.body.classList.toggle('light-chrome', currentIndex === 2 || currentIndex === 3);
    $('#currentScene').textContent = String(currentIndex + 1).padStart(2, '0');
    $('#progressFill').style.width = `${((currentIndex + 1) / totalSlides) * 100}%`;
    $('#previousSlide').disabled = currentIndex === 0;
    $('#nextSlide').disabled = currentIndex === totalSlides - 1;

    if (focusSlide) {
      const heading = $('h1, h2', slides[currentIndex]);
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    slides[currentIndex].scrollTop = 0;
    if (typeof startCanvasAnimation === 'function') startCanvasAnimation();
    if (currentIndex === 1 && !$('#wishBubble').classList.contains('is-empty')) {
      // Keep the last selected flower wish visible when revisiting the garden.
    }
  }

  $$('[data-next]').forEach(button => button.addEventListener('click', () => goTo(currentIndex + 1)));
  $$('[data-go]').forEach(button => button.addEventListener('click', (event) => {
    if (button.tagName === 'A') event.preventDefault();
    goTo(button.dataset.go);
  }));
  $('#previousSlide').addEventListener('click', () => goTo(currentIndex - 1));
  $('#nextSlide').addEventListener('click', () => goTo(currentIndex + 1));

  document.addEventListener('keydown', (event) => {
    if ($('#messageDialog').open) {
      if (event.key === 'Escape') $('#messageDialog').close();
      return;
    }
    if (!$('#letterEditor').hidden) {
      if (event.key === 'Escape') closeEditor();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select'].includes(tag) || target?.isContentEditable) return;
    if (event.key === ' ' && target?.closest('button, a, label, summary')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault(); goTo(currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault(); goTo(currentIndex - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); goTo(currentIndex + 1);
    } else if (event.key === 'Escape' && envelope?.classList.contains('is-open')) {
      envelope.classList.remove('is-open');
      $('#openLetter').innerHTML = 'Mở tấm thiệp <span aria-hidden="true">♡</span>';
      $('#letterCaption').textContent = 'Một chút yêu thương, được gói ghém cẩn thận.';
    } else if (event.key === 'Home') {
      event.preventDefault(); goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault(); goTo(totalSlides - 1);
    }
  });

  const presentation = $('#presentation');
  presentation.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, a, input, textarea, label, dialog, .letter-editor')) return;
    isPointerDown = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  }, { passive: true });
  presentation.addEventListener('pointerup', (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) goTo(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
  presentation.addEventListener('pointercancel', () => { isPointerDown = false; }, { passive: true });

  // Garden wishes: each flower is keyboard and touch accessible.
  const wishBubble = $('#wishBubble');
  $$('.flower-spot').forEach((button) => {
    button.addEventListener('click', () => {
      const wish = wishes[Number(button.dataset.wish) % wishes.length];
      $('#wishLabel').textContent = wish.label;
      $('#wishText').textContent = wish.text;
      wishBubble.classList.remove('is-empty');
      $$('.flower-spot').forEach(el => {
        const selected = el === button;
        el.classList.toggle('is-selected', selected);
        el.setAttribute('aria-pressed', String(selected));
      });
    });
  });
  $('#wishClose').addEventListener('click', () => {
    $('#wishLabel').textContent = 'MỘT LỜI NHẮN NHỎ';
    $('#wishText').textContent = 'Chọn một bông hoa để nhận lời chúc đầu tiên.';
    wishBubble.classList.add('is-empty');
    $$('.flower-spot').forEach(el => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-pressed', 'false');
    });
  });

  $('#randomWish').addEventListener('click', () => {
    const choices = wishes.map(item => item.text);
    const target = $('#randomWishText');
    let next = choices[Math.floor(Math.random() * choices.length)];
    if (target.dataset.last === next) next = choices[(choices.indexOf(next) + 1) % choices.length];
    target.dataset.last = next;
    target.textContent = `“${next}”`;
    target.classList.remove('wish-change');
    void target.offsetWidth;
    target.classList.add('wish-change');
  });

  const messageDialog = $('#messageDialog');
  $$('[data-message]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = messageCards[button.dataset.message];
      if (!item) return;
      messageReturnFocus = button;
      $('#messageDialogKicker').textContent = item.kicker;
      $('#messageDialogTitle').textContent = item.title;
      $('#messageDialogBody').textContent = item.body;
      if (typeof messageDialog.showModal === 'function') messageDialog.showModal();
      else messageDialog.setAttribute('open', '');
      $('#closeMessageDialog').focus();
    });
  });
  $('#closeMessageDialog').addEventListener('click', () => messageDialog.close());
  messageDialog.addEventListener('click', (event) => {
    if (event.target === messageDialog) messageDialog.close();
  });
  messageDialog.addEventListener('close', () => {
    if (messageReturnFocus && typeof messageReturnFocus.focus === 'function') messageReturnFocus.focus({ preventScroll: true });
  });

  // Local photo album. Images are resized before persisting to reduce storage use.
  const gallery = $('#memoryGallery');
  const originalPhotoSources = $$('[data-memory-img]').map(img => img.getAttribute('src'));
  const storedPhotos = safeRead(STORAGE.photos, {});
  const savedPhotos = storedPhotos && typeof storedPhotos === 'object' && !Array.isArray(storedPhotos) ? storedPhotos : {};
  $$('[data-memory-img]').forEach((img, index) => {
    if (typeof savedPhotos[index] === 'string' && savedPhotos[index].startsWith('data:image/')) img.src = savedPhotos[index];
  });
  $('#editPhotos').addEventListener('click', () => {
    const isEditing = gallery.classList.toggle('is-editing');
    $('#editPhotos').innerHTML = isEditing ? 'Xong, cất album <span aria-hidden="true">✓</span>' : 'Thay ảnh của bạn <span aria-hidden="true">＋</span>';
    if (isEditing) showToast('Chọn “Đổi ảnh” trên từng khung để thêm kỷ niệm của bạn.');
  });
  $$('[data-photo-index]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { showToast('Tệp này không phải hình ảnh.'); input.value = ''; return; }
      if (file.size > 20 * 1024 * 1024) { showToast('Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn 20 MB.'); input.value = ''; return; }
      try {
        const resized = await resizeImage(file, 1100, .78);
        const index = String(input.dataset.photoIndex);
        const stored = safeRead(STORAGE.photos, {});
        const current = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
        current[index] = resized;
        if (safeWrite(STORAGE.photos, current, 'Bộ nhớ trình duyệt đã đầy. Hãy thử ảnh nhỏ hơn hoặc xóa dữ liệu album cũ.')) {
          const img = $(`[data-memory-img="${index}"]`);
          img.src = resized;
          showToast('Đã cập nhật ảnh vào album trên thiết bị này.');
        }
      } catch (error) {
        showToast('Không đọc được ảnh này. Hãy thử một tệp khác.');
      } finally {
        input.value = '';
      }
    });
  });
  $('#resetPhotos').addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE.photos); } catch (error) {}
    $$('[data-memory-img]').forEach((img, index) => { img.src = originalPhotoSources[index]; });
    gallery.classList.remove('is-editing');
    $('#editPhotos').innerHTML = 'Thay ảnh của bạn <span aria-hidden="true">＋</span>';
    showToast('Album đã được khôi phục về ảnh mẫu.');
  });

  function resizeImage(file, maxDimension, quality) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          ctx.fillStyle = '#fffaf0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(objectUrl); reject(error);
        }
      };
      image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not decode image')); };
      image.src = objectUrl;
    });
  }

  // Personalised greeting card.
  const editor = $('#letterEditor');
  const envelope = $('#envelope');
  const defaultLetter = {
    recipient: 'bạn',
    greeting: 'Chúc bạn một ngày 20/10 thật đẹp!',
    body: 'Mong bạn luôn được yêu thương, được lắng nghe và được là chính mình. Chúc bạn đủ sức mạnh để đi về phía ước mơ, đủ bình yên để tận hưởng những điều giản dị và luôn nhớ rằng sự hiện diện của bạn làm thế giới này đẹp hơn rất nhiều.',
    signature: 'Huỳnh Trương Gia Huy · 12 Tin'
  };
  let currentLetter = { ...defaultLetter, ...(safeRead(STORAGE.letter, {}) || {}) };

  function renderLetter(letter) {
    const recipient = (letter.recipient || '').trim();
    $('#letterGreeting').textContent = letter.greeting || defaultLetter.greeting;
    $('#letterBody').textContent = letter.body || defaultLetter.body;
    $('#letterSignature').textContent = letter.signature || defaultLetter.signature;
    $('#letterCaption').textContent = recipient && recipient.toLocaleLowerCase('vi') !== 'bạn'
      ? `Một tấm thiệp nhỏ, gửi riêng đến ${recipient}.`
      : 'Một chút yêu thương, được gói ghém cẩn thận.';
  }
  function setEditorValues(letter) {
    $('#recipientInput').value = letter.recipient || '';
    $('#greetingInput').value = letter.greeting || '';
    $('#bodyInput').value = letter.body || '';
    $('#signatureInput').value = letter.signature || '';
  }
  renderLetter(currentLetter);
  $('#openLetter').addEventListener('click', () => {
    const opening = !envelope.classList.contains('is-open');
    envelope.classList.toggle('is-open', opening);
    $('#openLetter').innerHTML = opening ? 'Gấp thiệp lại <span aria-hidden="true">↻</span>' : 'Mở tấm thiệp <span aria-hidden="true">♡</span>';
    $('#letterCaption').textContent = opening ? 'Một lời chúc nhỏ, mong sẽ ở lại thật lâu.' : 'Một chút yêu thương, được gói ghém cẩn thận.';
  });
  $('#customizeLetter').addEventListener('click', openEditor);
  $('#closeEditor').addEventListener('click', closeEditor);
  $('#cancelEditor').addEventListener('click', closeEditor);
  function openEditor() {
    editorReturnFocus = document.activeElement;
    setEditorValues(currentLetter);
    editor.hidden = false;
    $('#recipientInput').focus();
  }
  function closeEditor(returnFocus = true) {
    if (editor.hidden) return;
    editor.hidden = true;
    if (returnFocus && editorReturnFocus && typeof editorReturnFocus.focus === 'function') {
      editorReturnFocus.focus({ preventScroll: true });
    }
  }
  editor.addEventListener('submit', (event) => {
    event.preventDefault();
    currentLetter = {
      recipient: $('#recipientInput').value.trim().slice(0, 80) || 'bạn',
      greeting: $('#greetingInput').value.trim().slice(0, 100) || defaultLetter.greeting,
      body: $('#bodyInput').value.trim().slice(0, 650) || defaultLetter.body,
      signature: $('#signatureInput').value.trim().slice(0, 100) || defaultLetter.signature
    };
    renderLetter(currentLetter);
    safeWrite(STORAGE.letter, currentLetter, 'Không thể lưu thiệp trên trình duyệt này. Hãy thử đóng bớt dữ liệu trang web.');
    envelope.classList.add('is-open');
    $('#openLetter').innerHTML = 'Gấp thiệp lại <span aria-hidden="true">↻</span>';
    closeEditor();
    showToast('Đã lưu tấm thiệp của bạn trên trình duyệt này.');
  });

  // Falling petals toggle.
  const petalLayer = $('#petalLayer');
  function createPetals() {
    if (reducedMotion || !petalEnabled) { petalLayer.replaceChildren(); return; }
    const amount = window.innerWidth < 600 ? 9 : 17;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < amount; i++) {
      const petal = document.createElement('span');
      petal.className = 'falling-petal';
      petal.style.setProperty('--x', `${Math.random() * 100}%`);
      petal.style.setProperty('--size', `${5 + Math.random() * 8}px`);
      petal.style.setProperty('--duration', `${13 + Math.random() * 16}s`);
      petal.style.setProperty('--delay', `${-Math.random() * 25}s`);
      petal.style.setProperty('--angle', `${Math.random() * 360}deg`);
      petal.style.setProperty('--opacity', `${.25 + Math.random() * .5}`);
      fragment.appendChild(petal);
    }
    petalLayer.replaceChildren(fragment);
  }
  const savedPetal = safeRead(STORAGE.petal, true);
  if (typeof savedPetal === 'boolean') petalEnabled = savedPetal;
  $('#petalToggle').setAttribute('aria-pressed', String(petalEnabled));
  createPetals();
  $('#petalToggle').addEventListener('click', () => {
    petalEnabled = !petalEnabled;
    $('#petalToggle').setAttribute('aria-pressed', String(petalEnabled));
    safeWrite(STORAGE.petal, petalEnabled, 'Không thể ghi nhớ tùy chọn này trên trình duyệt hiện tại.');
    createPetals();
    showToast(petalEnabled ? 'Cánh hoa đang nhẹ nhàng bay.' : 'Đã tắt hiệu ứng cánh hoa.');
  });
  window.addEventListener('resize', () => createPetals(), { passive: true });

  // Original, self-contained animated botanical scenes drawn on canvas.
  const palettes = [
    ['#8e2849', '#c64e73', '#ef95ae', '#ffd6dd'],
    ['#b54e68', '#e2819c', '#f4bac9', '#fff0df'],
    ['#9e3c67', '#cf7097', '#f2aac9', '#ffdfec'],
    ['#9b3f50', '#d86e79', '#f3a4a1', '#ffdfcf'],
    ['#6b5c9b', '#a59bcc', '#e2d8f1', '#fff2eb']
  ];
  const mainFlowers = [
    { x: .13, y: .63, size: .11, palette: 1, kind: 'rose', seed: 1.1 },
    { x: .30, y: .57, size: .075, palette: 3, kind: 'daisy', seed: 4.2 },
    { x: .50, y: .66, size: .13, palette: 0, kind: 'rose', seed: 2.6 },
    { x: .71, y: .56, size: .085, palette: 2, kind: 'tulip', seed: 5.4 },
    { x: .86, y: .64, size: .105, palette: 4, kind: 'rose', seed: 3.6 }
  ];

  function makeRand(seed) {
    let value = Math.sin(seed * 1234.567) * 98765.4321;
    return () => {
      value = Math.sin(value * 1.23 + seed) * 43758.5453;
      return value - Math.floor(value);
    };
  }

  function ellipse(ctx, x, y, rx, ry, rotation, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(1, ry / Math.max(1, rx));
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }

  function drawCloud(ctx, x, y, s, alpha, time) {
    const drift = Math.sin(time * .00004 + x) * 12;
    ctx.save(); ctx.translate(x + drift, y); ctx.scale(s, s); ctx.globalAlpha = alpha;
    const gradient = ctx.createLinearGradient(0, -30, 0, 24);
    gradient.addColorStop(0, 'rgba(255,250,239,.9)'); gradient.addColorStop(1, 'rgba(255,245,225,.22)');
    ctx.fillStyle = gradient; ctx.beginPath();
    ctx.ellipse(-50, 2, 48, 17, 0, 0, Math.PI * 2);
    ctx.ellipse(-19, -11, 36, 25, 0, 0, Math.PI * 2);
    ctx.ellipse(16, -6, 43, 29, 0, 0, Math.PI * 2);
    ctx.ellipse(51, 3, 44, 17, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  }

  function drawLeaf(ctx, x, y, length, width, rotation, sway) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation + sway);
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, '#3c654e'); grad.addColorStop(.5, '#799b68'); grad.addColorStop(1, '#abc28a');
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(length * .18, -width * .65, length * .65, -width * .6, length, 0);
    ctx.bezierCurveTo(length * .62, width * .5, length * .2, width * .47, 0, 0);
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(length * .5, width * .04, length * .92, 0);
    ctx.strokeStyle = 'rgba(224,235,184,.57)'; ctx.lineWidth = Math.max(.6, width * .025); ctx.stroke();
    for (let i = .3; i < .9; i += .19) {
      ctx.beginPath(); ctx.moveTo(length * i, 0); ctx.lineTo(length * (i + .07), -width * .22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(length * i, 0); ctx.lineTo(length * (i + .05), width * .21); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPetal(ctx, size, rotation, colors, ringAlpha = 1, scale = 1, time = 0, index = 0) {
    ctx.save(); ctx.rotate(rotation); ctx.scale(scale, scale); ctx.globalAlpha = ringAlpha;
    ctx.beginPath(); ctx.moveTo(0, size * .04);
    ctx.bezierCurveTo(-size * .45, -size * .05, -size * .55, -size * .55, -size * .12, -size * .84);
    ctx.quadraticCurveTo(0, -size * .96, size * .12, -size * .84);
    ctx.bezierCurveTo(size * .55, -size * .55, size * .45, -size * .05, 0, size * .04);
    const grad = ctx.createLinearGradient(0, 0, 0, -size * .92);
    grad.addColorStop(0, colors[0]); grad.addColorStop(.34, colors[1]); grad.addColorStop(.74, colors[2]); grad.addColorStop(1, colors[3]);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,233,.37)'; ctx.lineWidth = Math.max(.45, size * .009); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -size * .03); ctx.quadraticCurveTo(size * .05, -size * .42, 0, -size * .78);
    ctx.strokeStyle = 'rgba(255,239,234,.22)'; ctx.lineWidth = Math.max(.5, size * .012); ctx.stroke();
    if (index % 3 === 0 && size > 13) {
      ctx.beginPath(); ctx.ellipse(size * .12, -size * .56, size * .035, size * .07, -.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.44)'; ctx.fill();
    }
    ctx.restore();
  }

  function drawFlowerHead(ctx, x, y, size, paletteIndex, kind, time, seed) {
    const palette = palettes[paletteIndex % palettes.length];
    const sway = Math.sin(time * .0011 + seed) * .045;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    if (kind === 'tulip') {
      ctx.save();
      ctx.translate(0, -size * .05);
      const tulipColors = palette;
      ctx.beginPath(); ctx.moveTo(-size * .58, size * .08);
      ctx.bezierCurveTo(-size * .74, -size * .34, -size * .54, -size * .93, -size * .2, -size * .75);
      ctx.quadraticCurveTo(-size * .07, -size * .68, 0, -size * .39);
      ctx.quadraticCurveTo(size * .07, -size * .69, size * .22, -size * .75);
      ctx.bezierCurveTo(size * .57, -size * .97, size * .73, -size * .37, size * .57, size * .08);
      ctx.quadraticCurveTo(0, size * .32, -size * .58, size * .08);
      const grad = ctx.createLinearGradient(-size * .3, -size, size * .3, size * .1);
      grad.addColorStop(0, tulipColors[3]); grad.addColorStop(.42, tulipColors[2]); grad.addColorStop(1, tulipColors[0]);
      ctx.fillStyle = grad; ctx.fill(); ctx.strokeStyle = 'rgba(255,235,231,.5)'; ctx.lineWidth = size * .018; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, size * .12); ctx.quadraticCurveTo(-size * .1, -size * .23, -size * .19, -size * .67); ctx.strokeStyle = 'rgba(255,241,229,.4)'; ctx.lineWidth = size * .025; ctx.stroke();
      ctx.restore(); ctx.restore(); return;
    }
    const petals = kind === 'daisy' ? 13 : 10;
    const outerSize = kind === 'daisy' ? size * .75 : size;
    for (let i = 0; i < petals; i++) {
      drawPetal(ctx, outerSize, i * Math.PI * 2 / petals + .05 * Math.sin(time * .0007 + seed), palette, .92, 1, time, i);
    }
    const innerCount = kind === 'daisy' ? 0 : 8;
    for (let i = 0; i < innerCount; i++) drawPetal(ctx, size * .72, i * Math.PI * 2 / innerCount + .19, [palette[0], palette[1], palette[2], palette[3]], .98, .78, time, i + 1);
    const coreRadius = kind === 'daisy' ? size * .25 : size * .19;
    const core = ctx.createRadialGradient(-coreRadius * .28, -coreRadius * .3, 1, 0, 0, coreRadius * 1.3);
    if (kind === 'daisy') {
      core.addColorStop(0, '#fff1ba'); core.addColorStop(.42, '#edbb5e'); core.addColorStop(1, '#a96a35');
    } else {
      core.addColorStop(0, '#facb9e'); core.addColorStop(.45, '#a74760'); core.addColorStop(1, '#66243f');
    }
    ctx.beginPath(); ctx.arc(0, 0, coreRadius, 0, Math.PI * 2); ctx.fillStyle = core; ctx.fill();
    if (kind !== 'daisy') {
      ctx.strokeStyle = 'rgba(255,211,194,.62)'; ctx.lineWidth = Math.max(1, size * .024); ctx.beginPath();
      ctx.arc(0, 0, coreRadius * .72, -.8, 3.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(size * .03, size * .015, coreRadius * .39, -.4, 3.7); ctx.stroke();
    } else {
      const rand = makeRand(seed + 3);
      for (let i = 0; i < 18; i++) {
        const a = rand() * Math.PI * 2; const r = rand() * coreRadius * .78;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(.5, size * .014), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? '#fbe098' : '#b87933'; ctx.fill();
      }
    }
    // A couple of dew drops make petals feel less flat.
    if (size > 25 && kind === 'rose') {
      ctx.beginPath(); ctx.ellipse(-size * .3, -size * .45, size * .035, size * .06, -.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(size * .34, -size * .22, size * .023, size * .042, .4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
    }
    ctx.restore();
  }

  function drawStemFlower(ctx, width, height, flower, time, detail = 1) {
    const x = flower.x * width;
    const headY = flower.y * height;
    const baseY = Math.min(height * 1.06, headY + height * (flower.size * (flower.kind === 'tulip' ? 3.9 : 3.7)));
    const size = Math.max(6, flower.size * height * .72);
    const sway = Math.sin(time * .001 + flower.seed) * size * .12;
    const stemGrad = ctx.createLinearGradient(x, headY, x + sway, baseY);
    stemGrad.addColorStop(0, '#7b9863'); stemGrad.addColorStop(.65, '#476c4d'); stemGrad.addColorStop(1, '#2c523e');
    ctx.beginPath(); ctx.moveTo(x, baseY); ctx.bezierCurveTo(x - sway * .5, baseY - (baseY - headY) * .35, x + sway * 1.4, headY + size * .9, x + sway, headY + size * .18);
    ctx.strokeStyle = stemGrad; ctx.lineWidth = Math.max(1, size * .075); ctx.lineCap = 'round'; ctx.stroke();
    drawLeaf(ctx, x - sway * .12, baseY - (baseY - headY) * .28, size * .8, size * .27, -2.65, Math.sin(time * .0014 + flower.seed) * .05);
    drawLeaf(ctx, x + sway * .35, baseY - (baseY - headY) * .57, size * .75, size * .25, -.48, Math.sin(time * .0014 + flower.seed + 1) * .05);
    if (detail > 1) drawLeaf(ctx, x + sway * .16, baseY - (baseY - headY) * .78, size * .53, size * .2, -2.45, Math.sin(time * .0014 + flower.seed + 2) * .06);
    drawFlowerHead(ctx, x + sway, headY, size, flower.palette, flower.kind, time, flower.seed);
  }

  function createBackgroundFlowers() {
    const list = [];
    const rand = makeRand(23);
    for (let i = 0; i < 54; i++) {
      const x = (i + rand() * .7) / 54;
      const y = .69 + rand() * .25;
      list.push({ x, y, size: .018 + rand() * .028, palette: Math.floor(rand() * palettes.length), kind: rand() > .8 ? 'daisy' : 'rose', seed: rand() * 8 + i });
    }
    for (let i = 0; i < 19; i++) {
      list.push({ x: rand(), y: .56 + rand() * .22, size: .025 + rand() * .028, palette: Math.floor(rand() * palettes.length), kind: rand() > .6 ? 'daisy' : 'rose', seed: rand() * 11 + i });
    }
    return list;
  }
  const backgroundFlowers = createBackgroundFlowers();
  const airborneSeeds = Array.from({ length: 34 }, (_, i) => {
    const rand = makeRand(i + 109);
    return { x: rand(), y: rand(), size: 1 + rand() * 2.4, drift: .05 + rand() * .12, phase: rand() * Math.PI * 2 };
  });

  function drawLandscape(ctx, width, height, time, mode) {
    ctx.clearRect(0, 0, width, height);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    if (mode === 'cover') {
      sky.addColorStop(0, '#8a718b'); sky.addColorStop(.28, '#d8a7b6'); sky.addColorStop(.53, '#f5d5c0'); sky.addColorStop(1, '#637b61');
    } else if (mode === 'letter') {
      sky.addColorStop(0, '#7e708c'); sky.addColorStop(.33, '#d7a3b4'); sky.addColorStop(.57, '#f2d2ba'); sky.addColorStop(1, '#49654f');
    } else {
      sky.addColorStop(0, '#91b6bd'); sky.addColorStop(.27, '#c8ded2'); sky.addColorStop(.48, '#f5dfc3'); sky.addColorStop(1, '#5e895e');
    }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    // Distant sun and translucent rays.
    const sunX = width * (mode === 'garden' ? .77 : .72);
    const sunY = height * (mode === 'cover' ? .24 : .18);
    const sunR = Math.min(width, height) * .14;
    const glow = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, sunR * 1.7);
    glow.addColorStop(0, mode === 'garden' ? 'rgba(255,244,199,.72)' : 'rgba(255,219,196,.42)');
    glow.addColorStop(.28, 'rgba(255,231,207,.23)'); glow.addColorStop(1, 'rgba(255,235,214,0)');
    ctx.fillStyle = glow; ctx.fillRect(sunX - sunR * 2, sunY - sunR * 2, sunR * 4, sunR * 4);
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR * .36, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,244,214,.7)'; ctx.fill();
    drawCloud(ctx, width * .21, height * .2, Math.max(.4, width / 1600), .24, time);
    drawCloud(ctx, width * .54, height * .28, Math.max(.34, width / 1900), .2, time + 6000);
    drawCloud(ctx, width * .88, height * .36, Math.max(.32, width / 2100), .16, time + 12000);
    // Soft layered hills create real depth behind the flowers.
    ctx.beginPath(); ctx.moveTo(0, height * .57);
    ctx.bezierCurveTo(width * .16, height * .48, width * .25, height * .6, width * .41, height * .53);
    ctx.bezierCurveTo(width * .58, height * .45, width * .7, height * .57, width, height * .49);
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
    const hill1 = ctx.createLinearGradient(0, height * .49, 0, height * .9);
    hill1.addColorStop(0, mode === 'garden' ? '#9cb78b' : '#8ea17d'); hill1.addColorStop(1, mode === 'garden' ? '#426a4f' : '#405844');
    ctx.fillStyle = hill1; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, height * .69);
    ctx.bezierCurveTo(width * .15, height * .61, width * .28, height * .72, width * .43, height * .66);
    ctx.bezierCurveTo(width * .63, height * .58, width * .8, height * .76, width, height * .63);
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
    const hill2 = ctx.createLinearGradient(0, height * .6, 0, height);
    hill2.addColorStop(0, '#6e9366'); hill2.addColorStop(1, '#244637'); ctx.fillStyle = hill2; ctx.fill();
    // A subtle winding path through the meadow.
    if (mode !== 'letter') {
      ctx.beginPath(); ctx.moveTo(width * .49, height * .63);
      ctx.bezierCurveTo(width * .47, height * .75, width * .64, height * .81, width * .56, height * 1.05);
      ctx.lineTo(width * .77, height * 1.06);
      ctx.bezierCurveTo(width * .73, height * .83, width * .61, height * .75, width * .58, height * .62);
      ctx.closePath(); ctx.fillStyle = 'rgba(234,215,184,.3)'; ctx.fill();
    }
    // Background floral silhouettes soften the horizon.
    const flowersToDraw = mode === 'cover' ? backgroundFlowers.filter((_, i) => i % 2 === 0) : backgroundFlowers;
    flowersToDraw.forEach((flower, index) => drawStemFlower(ctx, width, height, flower, time, index % 3 === 0 ? 2 : 1));
    mainFlowers.forEach((flower, index) => drawStemFlower(ctx, width, height, flower, time + index * 70, 2));
    // Floating pollen / distant petals.
    airborneSeeds.forEach((seed, i) => {
      const x = ((seed.x + time * .000008 * seed.drift) % 1) * width + Math.sin(time * .0002 + seed.phase) * 9;
      const y = (seed.y * .73 + .08 + Math.sin(time * .0003 + seed.phase) * .012) * height;
      ctx.beginPath(); ctx.ellipse(x, y, seed.size, seed.size * 1.5, seed.phase + time * .0002, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,245,222,${mode === 'garden' ? .22 : .13})`; ctx.fill();
    });
    // Atmospheric foreground, darker at the bottom to anchor the composition.
    const shade = ctx.createLinearGradient(0, height * .62, 0, height);
    shade.addColorStop(0, 'rgba(30,52,39,0)'); shade.addColorStop(1, mode === 'garden' ? 'rgba(25,45,34,.18)' : 'rgba(35,31,43,.22)');
    ctx.fillStyle = shade; ctx.fillRect(0, height * .6, width, height * .4);
  }

  const canvasSpecs = [
    { canvas: $('#coverGarden'), mode: 'cover' },
    { canvas: $('#fullGarden'), mode: 'garden' },
    { canvas: $('#letterGarden'), mode: 'letter' }
  ].filter(item => item.canvas);
  let lastFrameAt = 0;
  let animationFrame = 0;
  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }
  function frame(timestamp) {
    if (!reducedMotion && timestamp - lastFrameAt < 1000 / 30) {
      animationFrame = requestAnimationFrame(frame);
      return;
    }
    lastFrameAt = timestamp;
    const time = reducedMotion ? 0 : timestamp;
    canvasSpecs.forEach(({ canvas, mode }) => {
      const isCurrentScene = (mode === 'cover' && currentIndex === 0) || (mode === 'garden' && currentIndex === 1) || (mode === 'letter' && currentIndex === 4);
      if (!isCurrentScene) return;
      const spec = prepareCanvas(canvas);
      if (spec) drawLandscape(spec.ctx, spec.width, spec.height, time, mode);
    });
    const hasAnimatedCanvas = currentIndex === 0 || currentIndex === 4;
    if (!document.hidden && !reducedMotion && hasAnimatedCanvas) animationFrame = requestAnimationFrame(frame);
  }
  function startCanvasAnimation() {
    cancelAnimationFrame(animationFrame);
    lastFrameAt = 0;
    frame(performance.now());
  }
  startCanvasAnimation();
  window.addEventListener('resize', startCanvasAnimation, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else startCanvasAnimation();
  });

  // Start at the beginning with all navigation state consistent.
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    if (i !== 0) slide.setAttribute('inert', '');
  });
  $('#currentScene').textContent = '01';
  $('#progressFill').style.width = '20%';
  $('#previousSlide').disabled = true;
  $('#nextSlide').disabled = false;
})();
