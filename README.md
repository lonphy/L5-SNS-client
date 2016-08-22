#L5 SNS client

1. **兼容性**  
	由于`Websocket` , `WebRtc`等兼容性问题，暂时只支持webkit

2. **功能**  
	简单视频、语音通话

3. **工作流程**  
	使用HTML5 `WebSocket`传输信令，`WebRTC`点对点通信， 模拟电话，3G电话
4. **对应的服务端**  
	* PHP版 https://github.com/lonphy/L5-SNS-server-php  
