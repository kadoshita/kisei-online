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
    const signalingConnection = Ayame.connection('wss://ayame-labo.shiguredo.jp/signaling', process.env.AYAME_ROOM_NAME, {
        signalingKey: process.env.AYAME_SIGNALING_KEY,
        audio: {
            direction: 'sendrecv'
        },
        video: {
            direction: 'sendrecv'
        }
    });
    signalingConnection.on('connect', () => {
        console.log('connect');
    });
    signalingConnection.on('addstream', e => {
        remoteVideo.srcObject = e.stream;
    });
    signalingConnection.on('removestream', e => {
        console.log(e);
        remoteVideo.srcObject = null;
    });
    signalingConnection.on('disconnect', e => {
        console.log(e);
        remoteVideo.srcObject = null;
    });

    let localStream = null;

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
    });
    closeButton.addEventListener('click', async () => {
        await signalingConnection.disconnect();
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        remoteVideo.srcObject = null;
        localVideo.srcObject = null;
    });
})();