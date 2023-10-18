import {useState , useCallback , useEffect} from "react";
import {useSocket} from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

export default function LobbyScreen()
{
    const navigate = useNavigate();
    const [room , setRoom] = useState("");
    const [email , setEmail] = useState("");

    const socket = useSocket();

    const handleSubmitForm = useCallback((e)=>
    {
        e.preventDefault();
        socket.emit("room:join" , {email, room});
    }, [room , email , socket]);

    const handleJoinRoom = useCallback((data) => {
      const {email , room} = data;
      navigate(`./room/${room}`)
    } , [navigate]);

    useEffect(() => 
    {
      socket.on("room:join" , handleJoinRoom);

      return () => 
      {
        socket.off("room:join", handleJoinRoom);
      }
    } , [socket , handleJoinRoom]);

    return (
        <div>
          <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmitForm}>
              <label htmlFor="email">Email ID</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
              <br />
              <label htmlFor="room">Room Number</label>
              <input
                type="text"
                id="room"
                value={room}
                onChange={(e)=>setRoom(e.target.value)}
              />
              <br />
              <button>Join</button>
            </form>
        </div>
      </div>
    )
}