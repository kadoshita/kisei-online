import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '../css/style.css';

(async () => {
    const localVideo = document.getElementById('local-video');
    const videoDeviceList = document.getElementById('video-device-list');
    const audioInputDeviceList = document.getElementById('audio-input-device-list');
    const audioOutputDeviceList = document.getElementById('audio-output-device-list');
    const deviceSetting = {
        videoDeviceId: '',
        audioInputDeviceId: '',
        audioOutputDeviceId: ''
    };

    let localStream = null;

    const changeVideoDevice = async deviceId => {
        deviceSetting.videoDeviceId = deviceId;
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: deviceId,
                frameRate: {
                    ideal: 5,
                    max: 10
                }
            },
            audio: {
                deviceId: deviceSetting.audioInputDeviceId
            }
        });
        localVideo.srcObject = localStream;
    };
    const changeAudioInputDevice = async deviceId => {
        deviceSetting.audioInputDeviceId = deviceId;
        localStream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: deviceSetting.videoDeviceId,
                frameRate: {
                    ideal: 5,
                    max: 10
                }
            },
            audio: {
                deviceId: deviceId
            }
        });
        localVideo.srcObject = localStream;
    }

    localStream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: { ideal: 5, max: 10 } }, audio: true });
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
})();