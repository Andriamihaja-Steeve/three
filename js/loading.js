// Fonction pour vérifier que toutes les polices sont chargées
function checkFonts() {
    return new Promise((resolve) => {
        document.fonts.ready.then(resolve);
    });
}

function checkImages() {
    return new Promise((resolve) => {
        const images = document.querySelectorAll('img');
        let loadedImages = 0;

        images.forEach((image) => {
            if (image.complete) {
                loadedImages++;
            } else {
                image.onload = image.onerror = () => {
                    loadedImages++;
                    if (loadedImages === images.length) {
                        resolve();
                    }
                };
            }
        });

        if (images.length === 0 || loadedImages === images.length) {
            resolve();
        }
    });
}

function loadResources() {
    return Promise.all([checkFonts(), checkImages()]);
}
loadResources().then(() => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.style.height = '3500vh';
        document.getElementById('loading-screen').style.display = 'none';
    }, 1000);
});