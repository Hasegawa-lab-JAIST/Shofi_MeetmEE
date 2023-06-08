import React, {createContext, useState, useRef, useEffect} from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
// let _stream;
// import { SelectAllTwoTone } from '@material-ui/icons';
// import { use } from 'express/lib/application';
// import { signal } from 'nodemon/lib/config/defaults';

const SocketContext = createContext();

// const socket = io('http://103.40.122.126:5000');
// const socket = io('http://localhost:5000')
const socket = io('https://trymeetme.sinaujogja.com');

const ContextProvider = ({children}) => {
    const [stream, setStream] = useState(null);
    const [me, setMe] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true})
            .then((currentStream) => {
                setStream(currentStream);

                myVideo.current.srcObject = currentStream;
            });
        
        socket.on('me', (id) => {
            setMe(id);
        });

        socket.on('calluser', ({ from, name: callerName, signal}) => {
            setCall({ isReceivedCall: true, from, name: callerName, signal});
        });
    }, []);

    const answersCall = () => {
        setCallAccepted(true)

        const peer = new Peer({ initiator: false, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('answercall', { signal: data, to: call.from});
        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        });

        peer.signal(call.signal);

        connectionRef.current = peer;
    };

    const callUser = (id) => {
        const peer = new Peer({ initiator: true, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('calluser', { userToCall: id, signalData: data, from: me, name});
        });

        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream;
        });

        socket.on('callaccepted', (signal) => {
            setCallAccepted(true);

            peer.signal(signal);
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy();

        window.location.reload();
    };

    return(
        <SocketContext.Provider value={{ call, callAccepted, myVideo, userVideo, stream, name, setName, callEnded, me, callUser, leaveCall, answersCall }}>
            {children}
        </SocketContext.Provider>
    );
};

export {ContextProvider, SocketContext};