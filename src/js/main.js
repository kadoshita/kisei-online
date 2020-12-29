import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import * as Ayame from '@open-ayame/ayame-web-sdk';
import '../css/style.css';

(async () => {
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    const connectButton = document.getElementById('connect-button');
    const videoDeviceList = document.getElementById('video-device-list');
    const audioInputDeviceList = document.getElementById('audio-input-device-list');
    const audioOutputDeviceList = document.getElementById('audio-output-device-list');
    const localSoundOnly = document.getElementById('local-sound-only');
    const remoteSoundOnly = document.getElementById('remote-sound-only');
    const deviceSetting = {
        videoDeviceId: '',
        audioInputDeviceId: '',
        audioOutputDeviceId: ''
    };

    let localStream = null;

    const dataChannelOnMessage = e => {
        console.log(e.data);
        const { type, value } = JSON.parse(e.data);
        switch (type) {
            case 'sound_only_mode': {
                localStream.getVideoTracks().forEach(t => t.enabled = !value);
                setTimeout(() => {
                    const localVideoRect = localVideo.getBoundingClientRect();
                    localSoundOnly.style.top = `${(localVideo.offsetHeight / 2) - 10}px`;
                    localSoundOnly.style.width = `${localVideoRect.width}px`;
                    localSoundOnly.style.marginLeft = '15px';

                    const remoteVideoRect = remoteVideo.getBoundingClientRect();
                    remoteSoundOnly.style.top = `${(remoteVideo.offsetHeight / 2) - 10}px`;
                    remoteSoundOnly.style.width = `${remoteVideoRect.right}px`;
                    remoteSoundOnly.style.paddingLeft = `${remoteVideoRect.x}px`;

                    localSoundOnly.style.display = value ? 'block' : 'none';
                    remoteSoundOnly.style.display = value ? 'block' : 'none';
                }, 500);
            }
        }
    }
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
    });
    signalingConnection.on('removestream', e => {
        console.log(e);
        remoteVideo.srcObject = null;
    });
    signalingConnection.on('disconnect', e => {
        console.log(e);
        remoteVideo.srcObject = null;
        localSoundOnly.style.display = 'none';
        remoteSoundOnly.style.display = 'none';
    });

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
        deviceSetting.videoDeviceId = deviceId;
        localStream = await navigator.mediaDevices.getUserMedia({
            video: getVideoConstraints(deviceId),
            audio: {
                deviceId: deviceSetting.audioInputDeviceId
            }
        });
        localVideo.srcObject = localStream;
    };
    const changeAudioInputDevice = async deviceId => {
        deviceSetting.audioInputDeviceId = deviceId;
        localStream = await navigator.mediaDevices.getUserMedia({
            video: getVideoConstraints(deviceSetting.videoDeviceId),
            audio: {
                deviceId: deviceId
            }
        });
        localVideo.srcObject = localStream;
    }

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
    deviceList.filter(d => d.kind === 'audioinput').forEach(d => {
        const listItem = document.createElement('option');
        listItem.innerText = d.label;
        listItem.value = d.deviceId;
        audioInputDeviceList.appendChild(listItem);
    });
    deviceList.filter(d => d.kind === 'audiooutput').forEach(d => {
        const listItem = document.createElement('option');
        listItem.innerText = d.label;
        listItem.value = d.deviceId;
        audioOutputDeviceList.appendChild(listItem);
    });

    videoDeviceList.addEventListener('change', e => {
        changeVideoDevice(e.target.value);
    });
    audioInputDeviceList.addEventListener('change', e => {
        changeAudioInputDevice(e.target.value);
    });
    audioOutputDeviceList.addEventListener('change', async e => {
        deviceSetting.audioOutputDeviceId = e.target.value;
        await remoteVideo.setSinkId(e.target.value);
    });
    connectButton.addEventListener('click', async () => {
        await signalingConnection.connect(localStream);
    });
})();