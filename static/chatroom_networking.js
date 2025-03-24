var myID;
var _peer_list = {};
var respondinginterval;
var is_Getanswer_activated = false;
var is_GetanswerAdd_activated = false;

const _awaitUnlock = async (mutex) => {
    // 잠금 상태가 아님 -> 즉시 resolve
    if (!mutex._locked) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        // 0.1초 후에 다시 확인
        setTimeout(() => {
            _awaitUnlock(mutex).then(() => resolve());
        }, 100);
    });
};

class Mutex {
    constructor() {
        this._locked = false;
    }

    async lock() {
        // 잠금 상태가 풀릴 때 까지 대기
        await _awaitUnlock(this);
        this._locked = true;
    }

    // 잠금 해제는 별도의 제약을 주지 않음.
    release() {
        this._locked = false;
    }
}
const mutex = new Mutex();
// socketio
var protocol = window.location.protocol;
var socket = io('https://10.101.66.10:5000');
//var socket = io('http://127.0.0.1:5000');

document.addEventListener('DOMContentLoaded', (event) => {
    startCamera();
});

var camera_allowed = false;
var mediaConstraints = {
    audio: true,
    video: {
        height: 360,
    },
};

function startCamera() {
    navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then((stream) => {
            myVideo.srcObject = stream;
            camera_allowed = true;
            setAudioMuteState(audioMuted);
            setVideoMuteState(videoMuted);
            //start the socketio connection
            socket.connect();
        })
        .catch((e) => {
            console.log('getUserMedia Error! ', e);
        });
}

socket.on('connect', () => {
    console.log('socket connected....');
    console.log(myRoomID);
    socket.emit('join-room', { room_id: myRoomID });
});
socket.on('user-connect', (data) => {
    console.log('user-connect ', data);
    let peer_id = data['sid'];
    let display_name = data['name'];
    _peer_list[peer_id] = undefined; // add new user to user list
    addVideoElement(peer_id, display_name);
});
socket.on('user-disconnect', (data) => {
    console.log('user-disconnect ', data);
    let peer_id = data['sid'];
    closeConnection(peer_id);
    removeVideoElement(peer_id);
});
socket.on('user-list', (data) => {
    console.log('user list recvd ', data);
    myID = data['my_id'];
    console.log('myid', myID);
    if ('list' in data) {
        // not the first to connect to room, existing user list recieved
        let recvd_list = data['list'];
        // add existing users to user list
        for (peer_id in recvd_list) {
            display_name = recvd_list[peer_id];
            _peer_list[peer_id] = undefined;
            addVideoElement(peer_id, display_name);
        }
        start_webrtc();
    }
});

function closeConnection(peer_id) {
    if (peer_id in _peer_list) {
        _peer_list[peer_id].onicecandidate = null;
        _peer_list[peer_id].ontrack = null;
        _peer_list[peer_id].onnegotiationneeded = null;

        delete _peer_list[peer_id]; // remove user from user list
    }
}

function log_user_list() {
    for (let key in _peer_list) {
        console.log(`${key}: ${_peer_list[key]}`);
    }
}

//---------------[ webrtc ]--------------------

var PC_CONFIG = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ],
        },
    ],
};

function log_error(e) {
    console.log('[ERROR] ', e);
}
function sendViaServer(data) {
    socket.emit('data', data);
}

socket.on('chatrespond', (data) => {
    var index = 0;
    let name = data['name'];
    let message = data['message'];
    var messageList = document.getElementById('user-chat-messages'); // 요소를 가져옵니다.
    var newMessage = document.createElement('li'); // 새로운 리스트 아이템을 생성합니다.
    var textNode = document.createTextNode(name + ': '); // 텍스트 노드를 생성합니다.
    newMessage.appendChild(textNode); // 리스트 아이템에 텍스트 노드를 추가합니다.
    messageList.appendChild(newMessage); // 요소에 리스트 아이템을 추가합니다.
    var interval = setInterval(function () {
        // 텍스트의 모든 글자를 출력했는지 확인
        if (index < message.length) {
            // 다음 글자를 텍스트 요소에 추가
            messageList.lastChild.textContent += message[index];
            // 다음 글자로 이동
            index++;
        } else {
            // 모든 글자를 출력한 경우 interval을 멈춤
            clearInterval(interval);
        }
    }, 25); // 0.1초(100밀리초)마다 실행
});
socket.on('filereturn', (data) => {
    console.log('filereturn 발생');
    if (data == true) {
        alert('파일 업로드 성공');
    } else {
        alert('파일 업로드 실패');
    }
});

socket.on('tutor', () => {
    var event = new Event('tutor');
    document.dispatchEvent(event);
});

// function callback_responding_PPT()
// {
//     let count = 1;
//     let dots = ".";
//     respondinginterval = setInterval(() => {
//         let displayedDots = dots.repeat(count);
//         // 마지막 메시지를 가져옵니다.
//         let lastMessage = messageList.lastChild;
//         // 마지막 메시지의 텍스트를 업데이트합니다.
//         lastMessage.textContent = "흙PT : 관련 PPT 답변 중 : " + displayedDots;
//         count = (count % 4) + 1; // 1부터 3까지 순환
//     }, 1000);

// }
// function callback_responding_CHAT(messageList)
// {   var newMessage = document.createElement('li'); // 새로운 리스트 아이템을 생성합니다.
//     var textNode = document.createTextNode("흙PT : "); // 텍스트 노드를 생성합니다.
//     newMessage.appendChild(textNode); // 리스트 아이템에 텍스트 노드를 추가합니다.
//     messageList.appendChild(newMessage); // 요소에 리스트 아이템을 추가합니다.
//     let count = 1;
//     let dots = ".";
//     respondinginterval = setInterval(() => {
//         let displayedDots = dots.repeat(count);
//         // 마지막 메시지를 가져옵니다.
//         let lastMessage = messageList.lastChild;
//         // 마지막 메시지의 텍스트를 업데이트합니다.
//         lastMessage.textContent = "흙PT : 관련 답변 중 : " + displayedDots;
//         count = (count % 4) + 1; // 1부터 3까지 순환
//     }, 1000);

// }

socket.on('GetAnswer', async (data) => {
    await mutex.lock();
    is_Getanswer_activated = true;
    console.log('mutex activate in GetAnswer');
    try {
        if (ellipsisInterval) {
            clearInterval(ellipsisInterval);
            console.log('elip is killed by GetAnswer');
        } else if (respondinginterval) {
            clearInterval(respondinginterval);
            console.log('res is killed by GetAnswer');
        }

        let dots = '.';
        count = 1;
        console.log(data);
        //인터벌 함수 중지

        var messageList = document.getElementById('ai-chat-messages'); // 요소를 가져옵니다.
        // 인터벌 메세지 지우기
        messageList.removeChild(messageList.lastChild); // 생성중 메시지 삭제

        var newMessage = document.createElement('li'); // 새로운 리스트 아이템을 생성합니다.
        var textNode = document.createTextNode('[CHAIR BOT] : '); // 텍스트 노드를 생성합니다.
        newMessage.appendChild(textNode); // 리스트 아이템에 텍스트 노드를 추가합니다.
        messageList.appendChild(newMessage); // 요소에 리스트 아이템을 추가합니다.

        function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        async function doSomethingPeriodically(messageList, message) {
            let index = 0;
            while (index < message.length) {
                // 작업 수행
                messageList.lastChild.textContent += message[index];
                index++;

                // 1초 후에 작업을 다시 수행하기 위해 대기
                await delay(25);
            }
        }
        // 함수 호출
        await doSomethingPeriodically(messageList, data);

        var newinnermessage = document.createElement('li');
        var newinnsertextnode = document.createTextNode('[CHAIR BOT]:  답변 중');
        newinnermessage.appendChild(newinnsertextnode);
        messageList.appendChild(newinnermessage);

        respondinginterval = setInterval(() => {
            let displayedDots = dots.repeat(count);
            // 마지막 메시지를 가져옵니다.
            let lastMessage = messageList.lastChild;
            // 마지막 메시지의 텍스트를 업데이트합니다.
            lastMessage.textContent = '[CHAIR BOT] : 관련 답변 중 : ' + displayedDots;
            count = (count % 4) + 1; // 1부터 3까지 순환
        }, 1000);

        // respondinginterval = setInterval(() => {
        //     let displayedDots = dots.repeat(count);
        //     // 마지막 메시지를 가져옵니다.
        //     let lastMessage = messageList.lastChild;
        //     // 마지막 메시지의 텍스트를 업데이트합니다.
        //     lastMessage.textContent = "흙PT : 관련 답변 중 : " + displayedDots;
        //     count = (count % 4) + 1; // 1부터 3까지 순환
        // }, 1000);

        // var fun = function () {자를 출력했는지 확인
        //     if (index < data.le
        //     // 텍스트의 모든 글ngth) {
        //         // 다음 글자를 텍스트 요소에 추가
        //         messageList.lastChild.textContent += data[index];
        //         // 다음 글자로 이동
        //         index++;
        //         setTimeout(printText, 20);
        //     } else {
        //         // 모든 글자를 출력한 경우 interval을 멈춤
        //         clearInterval(interval);
        //         var newNodeMessage = document.createElement('li'); // 새로운 리스트 아이템을 생성합니다.
        //         var newtextNode = document.createTextNode("흙PT 답변 생성 중.."); // 텍스트 노드를 생성합니다.
        //         newNodeMessage.appendChild(newtextNode); // 리스트 아이템에 텍스트 노드를 추가합니다.
        //         messageList.appendChild(newNodeMessage); // 요소에 리스트 아이템을 추가합니다.
        //         if(is_GetanswerAdd_activated==false){
        //             callback_responding_CHAT(messageList);
        //         }
        //     }
        // }; // 0.1초(100밀리초)마다 실행
    } finally {
        mutex.release();
        console.log('mutex released in GetAnswer');
        is_Getanswer_activated = false;
    }
});
socket.on('GetAnswer_Add', async (data) => {
    await mutex.lock();
    clearInterval(respondinginterval);
    messageList = document.getElementById('ai-chat-messages');
    messageList.removeChild(messageList.lastChild);

    console.log('mutex activated in GetAnswer_Add');
    try {
        if (ellipsisInterval) {
            clearInterval(ellipsisInterval);
            console.log('elip is killed by GetAnswer');
        } else if (respondinginterval) {
            clearInterval(respondinginterval);
            console.log('res is killed by GetAnswer');
        }

        ai_send_btn = document.getElementById('ai-send-btn');
        //messageList.removeChild(messageList.lastChild); // 생성중 메시지 삭제
        if (data == 'None') {
            console.log('image is none');
            var newMessage = document.createElement('li'); // 새로운 리스트 아이템을 생성합니다.
            var textNode = document.createTextNode('[CHAIR BOT] : 관련 슬라이드가 없습니다.'); // 텍스트 노드를 생성합니다.
            newMessage.appendChild(textNode); // 리스트 아이템에 텍스트 노드를 추가합니다.
            messageList.appendChild(newMessage); // 요소에 리스트 아이템을 추가합니다.
            ai_send_btn.disabled = false;
            ai_send_btn.style.background = 'white';
            ai_send_btn.style.color = 'black';
            ai_send_btn.textContent = '전송';
        } else {
            console.log('image_is_not_none');
            var blob = new Blob([data], { type: 'image/png' }); // 전달된 바이트 데이터를 Blob으로 변환
            var imageUrl = URL.createObjectURL(blob); // Blob을 URL로 변환하여 이미지로 사용
            // 이미지를 보여줄 ul 요소를 선택합니다.
            var ulElement = document.getElementById('ai-chat-messages');
            // 이미지를 보여줄 li 요소를 생성하고 이미지를 추가합니다.
            var liElement = document.createElement('li');
            var imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.classList.add('image-size'); // 이미지에 CSS 클래스 추가
            liElement.appendChild(imgElement);
            ulElement.appendChild(liElement);
            ai_send_btn.disabled = false;
            ai_send_btn.style.background = 'white';
            ai_send_btn.style.color = 'black';
            ai_send_btn.textContent = '전송';
        }
    } finally {
        mutex.release();
        console.log('mutex released in GetAnswer_Add');
        is_GetanswerAdd_activated = false;
    }
});
socket.on('FineTuneStart', (data) => {
    console.log('filereturn start 발생');
    if (data == true) {
        alert('파인튜닝 시작 성공');
    } else {
        alert('파인튜닝 시작 실패');
    }
});
socket.on('FineTuneEnd', (data) => {
    console.log('filereturn end 발생');
    if (data == true) {
        alert('파인튜닝 작업 완료 성공');
    } else {
        alert('파인튜닝 작업 완료 실패');
    }
});
socket.on('data', (msg) => {
    switch (msg['type']) {
        case 'offer':
            handleOfferMsg(msg);
            break;
        case 'answer':
            handleAnswerMsg(msg);
            break;
        case 'new-ice-candidate':
            handleNewICECandidateMsg(msg);
            break;
    }
});

function start_webrtc() {
    // send offer to all other members
    for (let peer_id in _peer_list) {
        invite(peer_id);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function invite(peer_id) {
    if (_peer_list[peer_id]) {
        console.log('[Not supposed to happen!] Attempting to start a connection that already exists!');
    } else if (peer_id === myID) {
        console.log('[Not supposed to happen!] Trying to connect to self!');
    } else {
        console.log(`Creating peer connection for <${peer_id}> ...`);
        createPeerConnection(peer_id);
        await sleep(2000);
        let local_stream = myVideo.srcObject;
        console.log(myVideo.srcObject);
        local_stream.getTracks().forEach((track) => {
            _peer_list[peer_id].addTrack(track, local_stream);
        });
        console.log(myVideo.srcObject);
    }
}

function createPeerConnection(peer_id) {
    _peer_list[peer_id] = new RTCPeerConnection(PC_CONFIG);

    _peer_list[peer_id].onicecandidate = (event) => {
        handleICECandidateEvent(event, peer_id);
    };
    _peer_list[peer_id].ontrack = (event) => {
        handleTrackEvent(event, peer_id);
    };
    _peer_list[peer_id].onnegotiationneeded = () => {
        handleNegotiationNeededEvent(peer_id);
    };
}

function handleNegotiationNeededEvent(peer_id) {
    _peer_list[peer_id]
        .createOffer()
        .then((offer) => {
            return _peer_list[peer_id].setLocalDescription(offer);
        })
        .then(() => {
            console.log(`sending offer to <${peer_id}> ...`);
            sendViaServer({
                sender_id: myID,
                target_id: peer_id,
                type: 'offer',
                sdp: _peer_list[peer_id].localDescription,
            });
        })
        .catch(log_error);
}

function handleOfferMsg(msg) {
    peer_id = msg['sender_id'];

    console.log(`offer recieved from <${peer_id}>`);

    createPeerConnection(peer_id);
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id]
        .setRemoteDescription(desc)
        .then(() => {
            let local_stream = myVideo.srcObject;
            local_stream.getTracks().forEach((track) => {
                _peer_list[peer_id].addTrack(track, local_stream);
            });
        })
        .then(() => {
            return _peer_list[peer_id].createAnswer();
        })
        .then((answer) => {
            return _peer_list[peer_id].setLocalDescription(answer);
        })
        .then(() => {
            console.log(`sending answer to <${peer_id}> ...`);
            sendViaServer({
                sender_id: myID,
                target_id: peer_id,
                type: 'answer',
                sdp: _peer_list[peer_id].localDescription,
            });
        })
        .catch(log_error);
}

function handleAnswerMsg(msg) {
    peer_id = msg['sender_id'];
    console.log(`answer recieved from <${peer_id}>`);
    let desc = new RTCSessionDescription(msg['sdp']);
    _peer_list[peer_id].setRemoteDescription(desc);
}

function handleICECandidateEvent(event, peer_id) {
    if (event.candidate) {
        sendViaServer({
            sender_id: myID,
            target_id: peer_id,
            type: 'new-ice-candidate',
            candidate: event.candidate,
        });
    }
}

function handleNewICECandidateMsg(msg) {
    console.log(`ICE candidate recieved from <${peer_id}>`);
    var candidate = new RTCIceCandidate(msg.candidate);
    _peer_list[msg['sender_id']].addIceCandidate(candidate).catch(log_error);
}

function handleTrackEvent(event, peer_id) {
    console.log(`track event recieved from <${peer_id}>`);

    if (event.streams) {
        getVideoObj(peer_id).srcObject = event.streams[0];
    }
}
