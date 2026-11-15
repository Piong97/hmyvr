
'use strict';

// ==========================================
// 1. MOBILE NAVIGATION
// ==========================================

const menuToggle = document.querySelector('#menu-toggle');
const primaryNav = document.querySelector('#primary-nav');

menuToggle?.addEventListener('click', () => {
  const open = primaryNav.classList.toggle('open');

  menuToggle.setAttribute('aria-expanded', String(open));
});

primaryNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const yearElement = document.querySelector('#year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


// ==========================================
// 2. SIGN LANGUAGE VIDEOS
// ==========================================

// Edit the English and Bahasa Melayu titles separately.

const stories = [
  {
    titleEn: 'Heritage Feature 01',
    titleBm: 'Heritage Feature 01',
    en: 'videos/sign-en-01.mp4',
    bm: 'videos/sign-bm-01.mp4'
  },
  {
    titleEn: 'Heritage Feature 02',
    titleBm: 'Heritage Feature 02',
    en: 'videos/sign-en-02.mp4',
    bm: 'videos/sign-bm-02.mp4'
  },
  {
    titleEn: 'Heritage Feature 03',
    titleBm: 'Heritage Feature 03',
    en: 'videos/sign-en-03.mp4',
    bm: 'videos/sign-bm-03.mp4'
  },
  {
    titleEn: 'Heritage Feature 04',
    titleBm: 'Heritage Feature 04',
    en: 'videos/sign-en-04.mp4',
    bm: 'videos/sign-bm-04.mp4'
  },
  {
    titleEn: 'Heritage Feature 05',
    titleBm: 'Heritage Feature 05',
    en: 'videos/sign-en-05.mp4',
    bm: 'videos/sign-bm-05.mp4'
  }
];

let activeLanguage = 'en';

const grid = document.querySelector('#video-grid');

function createStoryCard(story, index) {
  const card = document.createElement('article');
  card.className = 'story-card';

  const preview = document.createElement('div');
  preview.className = 'story-preview';

  const video = document.createElement('video');
  video.controls = true;
  video.preload = 'none';
  video.playsInline = true;

  const title = activeLanguage === 'bm'
    ? story.titleBm
    : story.titleEn;

  video.setAttribute(
    'aria-label',
    `${title} - ${
      activeLanguage === 'bm'
        ? 'Bahasa Melayu'
        : 'English'
    } subtitles`
  );

  const source = document.createElement('source');
  source.src = story[activeLanguage];
  source.type = 'video/mp4';

  video.append(source);

  const fallback = document.createElement('div');
  fallback.className = 'story-fallback';

  const number = String(index + 1).padStart(2, '0');

  fallback.innerHTML = `
    <span aria-hidden="true">▶</span>
    <small>VIDEO ${number}</small>
  `;

  preview.append(video, fallback);

  const info = document.createElement('div');
  info.className = 'story-info';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const subtitle = document.createElement('span');

  subtitle.textContent = activeLanguage === 'bm'
    ? 'BM SUBTITLES'
    : 'EN SUBTITLES';

  info.append(heading, subtitle);
  card.append(preview, info);

  video.addEventListener('play', () => {
    grid.querySelectorAll('video').forEach(other => {
      if (other !== video) {
        other.pause();
      }
    });
  });

  video.addEventListener('error', () => {
    video.hidden = true;
    fallback.classList.add('missing');

    fallback.querySelector('small').textContent =
      'VIDEO COMING SOON';
  });

  return card;
}

function renderStories() {
  if (!grid) return;

  grid.querySelectorAll('video').forEach(video => {
    video.pause();
  });

  grid.replaceChildren(
    ...stories.map(createStoryCard)
  );

  const indicator = document.querySelector('#language-indicator');

  if (indicator) {
    indicator.textContent = activeLanguage === 'bm'
      ? 'Bahasa Melayu subtitles'
      : 'English subtitles';
  }

  document.querySelectorAll('.language-button').forEach(button => {
    const selected = button.dataset.lang === activeLanguage;

    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

document.querySelectorAll('.language-button').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.lang === activeLanguage) return;

    activeLanguage = button.dataset.lang;
    renderStories();
  });
});

renderStories();


// ==========================================
// 3. WEBSITE TEASER
// ==========================================

const teaser = document.querySelector('#teaser-video');
const teaserEmpty = document.querySelector('#teaser-empty');

teaser?.addEventListener('error', () => {
  teaser.hidden = true;

  if (teaserEmpty) {
    teaserEmpty.hidden = false;
  }
}, true);


// ==========================================
// 4. COMIC PAGE IMAGES
// ==========================================

// Keep your comic images in assets/comic/.
// All pages are 1103 x 1426 pixels.
//

const comicPages = [
  'assets/comic/0.jpg',
  'assets/comic/1.jpg',
  'assets/comic/2.jpg',
  'assets/comic/3.jpg',
  'assets/comic/4.jpg',
  'assets/comic/5.jpg',
  'assets/comic/6.jpg',
  'assets/comic/7.jpg',
  'assets/comic/8.jpg',
  'assets/comic/9.jpg',
  'assets/comic/10.jpg',
  'assets/comic/11.jpg'
];

const flipbookElement = document.querySelector('#flipbook');
const placeholder = document.querySelector('#book-placeholder');

const pageCount = document.querySelector('#page-count');
const prevButton = document.querySelector('#page-prev');
const nextButton = document.querySelector('#page-next');

let flipbook = null;


// ==========================================
// 5. COMIC PAGE COUNTER
// ==========================================

function updateComicControls() {
  const current = flipbook
    ? flipbook.getCurrentPageIndex()
    : 0;

  const total = comicPages.length;

  if (pageCount) {
    pageCount.textContent =
      `${String(total ? current + 1 : 0).padStart(2, '0')} / ` +
      `${String(total).padStart(2, '0')}`;
  }

  if (prevButton) {
    prevButton.disabled = !flipbook || current <= 0;
  }

  if (nextButton) {
    nextButton.disabled = !flipbook || current >= total - 1;
  }
}


// ==========================================
// 6. LOAD COMIC FLIPBOOK
// ==========================================

function showComicError(message) {
  if (placeholder) {
    placeholder.hidden = false;

    const small = placeholder.querySelector('small');

    if (small) {
      small.textContent = message;
    }
  }

  if (flipbookElement) {
    flipbookElement.style.display = 'none';
  }

  updateComicControls();
}

function initializeComicFlipbook() {
  if (!flipbookElement || !comicPages.length) {
    updateComicControls();
    return;
  }

  if (!window.St?.PageFlip) {
    showComicError(
      'Flipbook library could not load. Check your internet connection.'
    );
    return;
  }

  // Original comic resolution: 1103 x 1426.
  const originalWidth = 1103;
  const originalHeight = 1426;
  const aspectRatio = originalHeight / originalWidth;

  // Display dimensions while preserving the original ratio.
  const pageWidth = 500;
  const pageHeight = Math.round(pageWidth * aspectRatio);

  const minWidth = 160;
  const maxWidth = 650;

  if (placeholder) {
    placeholder.hidden = true;
  }

  flipbookElement.style.display = 'block';
  flipbookElement.replaceChildren();

  comicPages.forEach((src, index) => {
    const page = document.createElement('div');
    page.className = 'page';

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Comic page ${index + 1}`;
    img.loading = index < 2 ? 'eager' : 'lazy';

    page.append(img);
    flipbookElement.append(page);
  });

  try {
    flipbook = new window.St.PageFlip(flipbookElement, {
      width: pageWidth,
      height: pageHeight,
      size: 'stretch',

      minWidth: minWidth,
      maxWidth: maxWidth,

      minHeight: Math.round(minWidth * aspectRatio),
      maxHeight: Math.round(maxWidth * aspectRatio),

      showCover: false,
      usePortrait: true,
      mobileScrollSupport: false,

      flippingTime: 650,
      maxShadowOpacity: 0.35
    });

    flipbook.loadFromHTML(
      flipbookElement.querySelectorAll('.page')
    );

    flipbook.on('flip', updateComicControls);
    updateComicControls();

  } catch (error) {
    console.error('Flipbook initialization failed:', error);
    flipbook = null;
    showComicError('Unable to initialize comic reader.');
  }
}

initializeComicFlipbook();


// ==========================================
// 7. COMIC PAGE NAVIGATION
// ==========================================

prevButton?.addEventListener('click', () => {
  flipbook?.flipPrev();
});

nextButton?.addEventListener('click', () => {
  flipbook?.flipNext();
});

document.querySelector('#book-viewport')
  ?.addEventListener('keydown', event => {
    if (!flipbook) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      flipbook.flipPrev();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      flipbook.flipNext();
    }
  });
