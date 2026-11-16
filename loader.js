
(() => {
  const MIN_DURATION = 1500;
  const MAX_DURATION = 3000;
  const startedAt = performance.now();

  const loader = document.getElementById('site-loader');
  if (!loader) return;

  let finished = false;

  function hideLoader() {
    if (finished) return;
    finished = true;

    loader.classList.add('is-hidden');

    setTimeout(() => {
      loader.remove();
    }, 450);
  }

  function waitForImage(img) {
    if (img.complete) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  async function startLoading() {
    // Only wait for images that are not lazy-loaded.
    const images = [
      ...document.querySelectorAll('img:not([loading="lazy"])')
    ];

    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    await Promise.race([
      Promise.all([
        new Promise(resolve => setTimeout(resolve, remaining)),
        Promise.all(images.map(waitForImage))
      ]),
      new Promise(resolve => setTimeout(resolve, Math.max(0, MAX_DURATION - elapsed)))
    ]);

    hideLoader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoading, { once: true });
  } else {
    startLoading();
  }

  // Safety fallback
  setTimeout(hideLoader, MAX_DURATION);
})();
