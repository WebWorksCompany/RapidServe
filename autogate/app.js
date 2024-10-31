class WebWorksAutoGate {
    url = '';
    robot = ()=>{};
    human = ()=>{};
    constructor(selector, url) {
        const element = document.querySelector(selector);
        this.url = url;

        if (!element) {
            console.error('Invalid ww-AutoGate selector');
            return;
        }

        this.targetX = null;
        this.targetY = null;

        // Fetch initial verification data
        this.fetchVerificationData(element);
    }
    async fetchVerificationData(element) {
        try {
            const response = await fetch(`${this.url}?type=new`);
            const data = await response.json();
            if (data.status === 'success') {
                if(data.type == 'photo_1'){
                    this.#create_photo1(element, data.resources, data.session);
                }
                if(data.type == 'photo_2'){
                    this.#create_photo2(element, data.resources, data.session);
                }
                if(data.type == 'word_1'){
                    this.#create_word1(element, data.resources, data.session);
                }
            } else {
                console.error('Error fetching verification data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching verification data:', error);
        }
    }
    async checkAns(answer, session, url) {
        const robot = this.robot;
        const human = this.human;
        const that = this;

        try {
            const response = await fetch(`${url}?type=check&answer=${answer}&session=${session}`);
            const data = await response.json();
            if (data.status === 'success') {
                if (data.human) {
                    human();
                    document.querySelector('div.ww-autogate-enable-container p').textContent = '✓ Human Verification';
                    document.body.click();
                } else {
                    robot();
                    document.querySelector('div.ww-autogate-enable-container p').textContent = '✘ Human Verification';
                    document.body.click();

                    // Restart it all again
                    document.querySelector('div.ww-autogate-enable-container').remove();
                    document.querySelector('div.ww-autogate-overlay').remove();
                    document.querySelector('div.ww-autogate').innerHTML = 'Human Verification Failed. Loading again...';
                    that.fetchVerificationData(document.querySelector('div.ww-autogate'));
                }
            } else {
                console.error('Error fetching verification data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching verification data:', error);
        }
    }
    #create_photo1(element, resources, session) {
        const newElement = document.createElement('div');
        newElement.classList.add('ww-autogate', 'photo-1');

        const bgImg = document.createElement('img');
        bgImg.src = resources.image;
        newElement.append(bgImg);
        bgImg.setAttribute('draggable', false);

        const cutoutImg = document.createElement('img');
        cutoutImg.src = resources.cutout;
        cutoutImg.style.position = 'absolute';
        cutoutImg.style.borderRadius = '100%';
        cutoutImg.style.cursor = 'grab';
        cutoutImg.style.outline = '2px solid black';
        newElement.append(cutoutImg);

        let dragging = false;

        // Mouse events
        cutoutImg.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            document.addEventListener('mouseup', mouseUp);
        });

        document.addEventListener('mousemove', (e) => {
            if (dragging) {
                this.moveCutout(cutoutImg, e);
            }
        });

        // Touch events
        cutoutImg.addEventListener('touchstart', (e) => {
            e.preventDefault();
            dragging = true;
            document.addEventListener('touchend', touchEnd);
        });

        document.addEventListener('touchmove', (e) => {
            if (dragging) {
                this.moveCutout(cutoutImg, e.touches[0]);
            }
        });

        const mouseUp = (e) => {
            dragging = false;
            document.removeEventListener('mouseup', mouseUp);
            this.checkPosition(cutoutImg, session);
        };

        const touchEnd = (e) => {
            dragging = false;
            document.removeEventListener('touchend', touchEnd);
            this.checkPosition(cutoutImg, session);
        };

        newElement.append(this.createTextElements('Drag the image to the correct location.'));

        element.parentElement.insertBefore(newElement, element);
        newElement.style.display = 'none';

        const overlay = document.createElement('div');
        overlay.classList.add('ww-autogate-overlay');
        overlay.style.display = 'none';
        document.body.append(overlay);

        const enableContainer = this.createEnableContainer(newElement, overlay, element);

        element.parentElement.insertBefore(enableContainer, element);
        element.remove();
    }
    #create_photo2(element, resources, session) {
        const newElement = document.createElement('div');
        newElement.classList.add('ww-autogate', 'photo-2');

        const bgImg = document.createElement('img');
        bgImg.src = resources.image;
        bgImg.setAttribute('draggable', false);
        newElement.append(bgImg);

        bgImg.addEventListener('click', (e)=>{
            const parentRect = bgImg.parentElement.getBoundingClientRect();
            const offsetX = e.clientX - parentRect.left;
            const offsetY = e.clientY - parentRect.top;

            // Create point contact point
            const point = document.createElement('div');
    
            point.style.marginTop = `${offsetY - 25}px`;
            point.style.marginLeft = `${offsetX - 25}px`;

            newElement.append(point);

            this.checkAns(parseInt(point.style.marginLeft)+'_'+parseInt(point.style.marginTop), session, this.url);
        });

        newElement.append(this.createTextElements('Click the '+resources.shape));

        element.parentElement.insertBefore(newElement, element);
        newElement.style.display = 'none';

        const overlay = document.createElement('div');
        overlay.classList.add('ww-autogate-overlay');
        overlay.style.display = 'none';
        document.body.append(overlay);

        const enableContainer = this.createEnableContainer(newElement, overlay, element);

        element.parentElement.insertBefore(enableContainer, element);
        element.remove();
    }
    #create_word1(element, resources, session) {
        const newElement = document.createElement('div');
        newElement.classList.add('ww-autogate', 'word-1');

        const bgImg = document.createElement('img');
        bgImg.src = resources.image;
        newElement.append(bgImg);
        bgImg.setAttribute('draggable', false);

        const inputBox = document.createElement('input');
        inputBox.placeholder = '6 Characters (A-Z 0-9)';
        newElement.append(inputBox);

        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit';
        newElement.append(submitBtn);

        submitBtn.addEventListener('click', ()=>{
            this.checkAns(inputBox.value.trim(), session, this.url);
        })
        inputBox.addEventListener('keydown', (e)=>{
            if(e.key == 'Enter'){
                submitBtn.click();
            }
        })

        newElement.append(this.createTextElements('Type the text you see in the box'));

        element.parentElement.insertBefore(newElement, element);
        newElement.style.display = 'none';

        const overlay = document.createElement('div');
        overlay.classList.add('ww-autogate-overlay');
        overlay.style.display = 'none';
        document.body.append(overlay);

        const enableContainer = this.createEnableContainer(newElement, overlay, element);

        element.parentElement.insertBefore(enableContainer, element);
        element.remove();
    }
    moveCutout(cutoutImg, e) {
        const parentRect = cutoutImg.parentElement.getBoundingClientRect();
        const rect = cutoutImg.getBoundingClientRect();
        const offsetX = e.clientX - parentRect.left; // For mouse
        const offsetY = e.clientY - parentRect.top;  // For mouse

        cutoutImg.style.marginTop = `${offsetY - rect.height / 2}px`;
        cutoutImg.style.marginLeft = `${offsetX - rect.width / 2}px`;
    }
    checkPosition(cutoutImg, session) {
        const placeX = parseInt(cutoutImg.style.marginLeft);
        const placeY = parseInt(cutoutImg.style.marginTop);
        const answer = `${placeX}_${placeY}`;
        this.checkAns(answer, session, this.url);
    }
    createTextElements(instruction) {
        const topText = document.createElement('h4');
        topText.textContent = 'Human Verification';

        const bottomText = document.createElement('p');
        bottomText.innerHTML = 'Powered By <a href="https://webworkshub.online/autogate">WebWorks AutoGate</a>. <a href="https://webworkshub.online/autogate/terms">Terms</a> apply.';

        const textHelp = document.createElement('h5');
        textHelp.innerHTML = instruction;

        const textContainer = document.createDocumentFragment();
        textContainer.append(topText, bottomText, textHelp);
        return textContainer;
    }
    createEnableContainer(newElement, overlay, element) {
        const enableContainer = document.createElement('div');
        enableContainer.classList.add('ww-autogate-enable-container');

        const label = document.createElement('p');
        label.textContent = 'Human Verification';
        enableContainer.append(label);

        enableContainer.addEventListener('click', () => {
            if(!enableContainer.firstChild.textContent.includes('✓')){
                newElement.style.display = 'flex';
                overlay.style.display = 'block';
                setTimeout(() => {
                    document.addEventListener('click', close);
                }, 200);
            }
        });

        function close(e) {
            if (e.target.classList.contains('ww-autogate') || e.target.parentElement.classList.contains('ww-autogate') || 
                (e.target.parentElement.parentElement && e.target.parentElement.parentElement.classList.contains('ww-autogate'))) {
                return;
            }
            document.removeEventListener('click', close);
            newElement.style.display = 'none';
            overlay.style.display = 'none';
        }

        return enableContainer;
    }
}
