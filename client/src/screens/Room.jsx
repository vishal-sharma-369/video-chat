import React, {useEffect, useCallback, useState} from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player"
import peer from "../service/peer"

const Room = () => 
{
    const socket = useSocket();
    const [remoteSocketId , setRemoteSocketId] = useState(null);
    const [myStream , setMyStream] = useState(null);
    const [remoteStream , setRemoteStream] = useState();

    const handleUserJoined = useCallback(({email , id}) => 
    {
        console.log(`Email ${email} joined the room`);
        setRemoteSocketId(id);
    } , []);

    const handleCallUser = useCallback(async() => 
    {
        const stream = await navigator.mediaDevices.getUserMedia({audio : true , video : true});
        const offer = await peer.getOffer();
        socket.emit("user:call" , {to:remoteSocketId , offer})
        setMyStream(stream);
    } , [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(async ({from , offer}) => 
    {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true
            }
        )
        setMyStream(stream);
        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted" , {to : from , ans});
    } ,[socket]);

    const sendStreams = useCallback(() => 
    {
        for(const track of myStream.getTracks())
        {
            peer.peer.addTrack(track , myStream);
        }
    },[myStream]);

    const handleCallAccepted = useCallback(({from, ans})=>
    {
        peer.setLocalDescription(ans);
        console.log("Call Accepted!");
        sendStreams();
    } , [sendStreams]);

    const handleNegoNeeded = useCallback( async() => 
    {
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed' , {offer , to: remoteSocketId});
    }, [remoteSocketId, socket]);

    const handleNegoNeedIncoming = useCallback(async(from , offer)=>
    {
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done" , {to : from , ans});
    } , [socket]);

    const handleNegoNeedFinal = useCallback(async({ans})=>
    {
        await peer.setLocalDescription(ans);
    } , []);

    // This is the use effect for handling the sockets
    useEffect(()=>{
        socket.on("user:joined" , handleUserJoined);
        socket.on("incomming:call" , handleIncommingCall);
        socket.on("call:accepted" , handleCallAccepted);
        socket.on("peer:nego:needed" , handleNegoNeedIncoming);
        socket.on("peer:nego:final" , handleNegoNeedFinal);

        return (() => 
        {
            socket.off("user:joined" , handleUserJoined);
            socket.off("incomming:call" , handleIncommingCall);
            socket.off("call:accepted" , handleCallAccepted);
            socket.off("peer:nego:needed" , handleNegoNeedIncoming);
            socket.off("peer:nego:final" , handleNegoNeedFinal);
        })
    } , [handleUserJoined, socket, handleIncommingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal]);

    // This is the use effect for handling the peer connections and stream transfers
    useEffect(() => 
    {
        peer.peer.addEventListener('track' , async ev =>
        {
            const remoteStream = ev.streams;
            setRemoteStream(remoteStream[0]);
        })
    } , []);


    // This is the use effect for handling the negotiations
    useEffect(()=>
    {
        peer.peer.addEventListener('negotiationneeded' , handleNegoNeeded)

        return () => 
        {
            peer.peer.removeEventListener("negotiationneeded" , handleNegoNeeded);
        }
    } , [handleNegoNeeded]);

    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId? "Connected" : "No one in room"}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {
                remoteSocketId && <button onClick={handleCallUser}>CALL</button>
            }
            {
                myStream && 
                <>
                    <h1>My Stream</h1>
                    <ReactPlayer playing muted height="100px" width="200px" url={myStream} />
                </>
            }

            {
                remoteStream && 
                <>
                    <h1>Remote Stream</h1>
                    <ReactPlayer playing muted height="100px" width="200px" url={remoteStream} />
                </>
            }
        </div>
    )
}

export default Room;