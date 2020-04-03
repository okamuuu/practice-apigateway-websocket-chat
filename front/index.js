import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const socket = new WebSocket('ws://localhost:3001')

const Application = () => {
  
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const handleChangeText = e => {
    setText(e.target.value)
  }

  const sendMessage = () => {
    // setMessages([...messages, text]) 
    socket.send(JSON.stringify({"action": "sendMessage", payload: text}))
  }

  // 接続直後
  socket.onopen = function(e) {
    console.log(e)
  }

  socket.onmessage = function(e) {
    const data = JSON.parse(e.data)
    console.log("onmessage:", data)
    if (data.messages) {
      setMessages(Object.assign([], data.messages))
    } else if (data.newMessage) {
      setMessages([...messages, data.newMessage])
    }
  }

  return (
    <>
      <section className="section">
        <div className="container">
          <h1 className="title">
            Hello Chat
          </h1>
          <p className="subtitle">
            My first Chat App with <strong>APIGateway</strong>
          </p>
          <div className="content">
            <div className="field is-grouped">
              <p className="control">
                <input className="input" type="text" value={text} onChange={handleChangeText} />
              </p>
              <div className="control">
                <button onClick={sendMessage} className="button is-primary">Submit</button>
              </div>
            </div>
            <br/ >
            { messages.map( msg => (
              <p>
                <strong>{ msg.connectionId }</strong> <small>{ msg.createdAt }</small>
                <br />
                { msg.type }: { msg.value }
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
ReactDOM.render(<Application />, document.getElementById('app'));
