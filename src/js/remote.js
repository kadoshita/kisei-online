import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import * as Ayame from '@open-ayame/ayame-web-sdk';
import '../css/remote.css';

(async () => {
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    const videoDeviceList = document.getElementById('video-device-list');
    const connectButton = document.getElementById('connect-button');
    const soundOnlyButton = document.getElementById('sound-only-button');
    const closeButton = document.getElementById('close-button');
    const localSoundOnly = document.getElementById('local-sound-only');
    const remoteSoundOnly = document.getElementById('remote-sound-only');

    const dataChannelOnMessage = e => {
        console.log(e.data);
        const { type, value } = JSON.parse(e.data);
        switch (type) {
            case 'sound_only_mode':
                console.log(value);
        }
    };

    const signalingConnection = Ayame.connection('wss://ayame-labo.shiguredo.jp/signaling', process.env.AYAME_ROOM_NAME, {
        signalingKey: process.env.AYAME_SIGNALING_KEY,
        audio: {
            direction: 'sendrecv'
        },
        video: {
            direction: 'sendrecv'
        },
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });
    let dataChannelConnection = null;
    signalingConnection.on('open', async () => {
        console.log('open');
        dataChannelConnection = await signalingConnection.createDataChannel('message');
        if (dataChannelConnection) {
            dataChannelConnection.onmessage = dataChannelOnMessage;
        }
    });
    signalingConnection.on('datachannel', channel => {
        if (!dataChannelConnection) {
            dataChannelConnection = channel;
            dataChannelConnection.onmessage = dataChannelOnMessage;
        }
    });
    signalingConnection.on('addstream', e => {
        remoteVideo.srcObject = e.stream;
        soundOnlyButton.disabled = false;
    });
    signalingConnection.on('removestream', e => {
        console.log(e);
        remoteVideo.srcObject = null;
    });
    signalingConnection.on('disconnect', async e => {
        console.log(e);
        remoteVideo.srcObject = null;
        await signalingConnection.disconnect();
    });

    let localStream = null;
    let isSoundOnlyMode = false;

    const getVideoConstraints = (deviceId = '') => {
        if (deviceId === '') {
            return {
                frameRate: {
                    ideal: 5,
                    max: 5
                },
                height: {
                    ideal: 240,
                    max: 480
                },
                width: {
                    ideal: 320,
                    max: 640
                }
            };
        }
        return {
            deviceId: deviceId,
            frameRate: {
                ideal: 5,
                max: 5
            },
            height: {
                ideal: 240,
                max: 480
            },
            width: {
                ideal: 320,
                max: 640
            }
        };
    };
    const changeVideoDevice = async deviceId => {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: getVideoConstraints(deviceId),
            audio: true
        });
        localVideo.srcObject = localStream;
    };

    localStream = await navigator.mediaDevices.getUserMedia({
        video: getVideoConstraints(),
        audio: true
    });
    localVideo.srcObject = localStream;
    connectButton.disabled = false;
    const deviceList = await navigator.mediaDevices.enumerateDevices();

    deviceList.filter(d => d.kind === 'videoinput').forEach(d => {
        const listItem = document.createElement('option');
        listItem.innerText = d.label;
        listItem.value = d.deviceId;
        if (localStream.getTracks()[0].label === d.label) {
            listItem.selected = true;
        }
        videoDeviceList.appendChild(listItem);
    });

    videoDeviceList.addEventListener('change', e => {
        changeVideoDevice(e.target.value);
    });
    connectButton.addEventListener('click', async () => {
        await signalingConnection.connect(localStream);
        connectButton.disabled = true;
        videoDeviceList.disabled = true;
    });
    soundOnlyButton.addEventListener('click', async () => {
        isSoundOnlyMode = !isSoundOnlyMode;
        soundOnlyButton.innerText = isSoundOnlyMode ? '声と動画' : '声だけ';
        dataChannelConnection.send(JSON.stringify({
            type: 'sound_only_mode',
            value: isSoundOnlyMode
        }));
        localStream.getVideoTracks().forEach(t => t.enabled = !isSoundOnlyMode);

        setTimeout(() => {
            const localVideoRect = localVideo.getBoundingClientRect();
            localSoundOnly.style.top = `${(localVideo.offsetHeight / 2) - 10}px`;
            localSoundOnly.style.width = `${localVideoRect.right}px`;
            localSoundOnly.style.paddingLeft = `${localVideoRect.x}px`;

            const remoteVideoRect = remoteVideo.getBoundingClientRect();
            remoteSoundOnly.style.top = `${(remoteVideo.offsetHeight / 2) - 10}px`;
            remoteSoundOnly.style.width = `${remoteVideoRect.right}px`;
            remoteSoundOnly.style.paddingLeft = `${remoteVideoRect.x}px`;

            localSoundOnly.style.display = isSoundOnlyMode ? 'block' : 'none';
            remoteSoundOnly.style.display = isSoundOnlyMode ? 'block' : 'none';
        }, 500);
    });
    closeButton.addEventListener('click', async () => {
        if (closeButton.innerText === 'もう一回') {
            return location.reload();
        }
        await signalingConnection.disconnect();
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        remoteVideo.srcObject = null;
        localVideo.srcObject = null;
        localSoundOnly.style.display = 'none';
        remoteSoundOnly.style.display = 'none';
        closeButton.classList.remove('btn-danger');
        closeButton.classList.add('btn-info');
        closeButton.innerText = 'もう一回';
    });
})();