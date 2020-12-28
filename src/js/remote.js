import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import '../css/remote.css';

(async () => {
    const localVideo = document.getElementById('local-video');
    const videoDeviceList = document.getElementById('video-device-list');

    let localStream = null;

    const changeVideoDevice = async deviceId => {
        localStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId }, audio: true });
        localVideo.srcObject = localStream;
    };

    localStream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: { ideal: 4, max: 10 } }, audio: true });
    localVideo.srcObject = localStream;
    const deviceList = await navigator.mediaDevices.enumerateDevices();

    deviceList.filter(d => d.kind === 'videoinput').forEach(d => {
        const listItem = document.createElement('option');
        listItem.innerText = d.label;
        listItem.value = d.deviceId;
        videoDeviceList.appendChild(listItem);
    });

    videoDeviceList.addEventListener('change', e => {
        changeVideoDevice(e.target.value);
    });
})();