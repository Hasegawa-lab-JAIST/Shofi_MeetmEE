import React, { useRef, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";

import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';

const useStyles = makeStyles(() => ({
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
}));

const CanvasUser = () => {
    const { myVideo } = useContext(SocketContext);
    const classes = useStyles();
    const canvasRef = useRef();

    // ======================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
    
    function onResults(results){
      const videoElement = myVideo.current;
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
  
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');
      canvasCtx.save();
  
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
  
      canvasCtx.globalCompositeOperation = 'source-over';
      connect(canvasCtx, results.poseLandmarks, HOLISTIC.POSE_CONNECTIONS,
                    {color: '#00FF00', lineWidth: 4});
      connect(canvasCtx, results.faceLandmarks, HOLISTIC.FACEMESH_TESSELATION,
                    {color: '#C0C0C070', lineWidth: 1});
      connect(canvasCtx, results.leftHandLandmarks, HOLISTIC.HAND_CONNECTIONS,
                    {color: '#CC0000', lineWidth: 5});
      connect(canvasCtx, results.rightHandLandmarks, HOLISTIC.HAND_CONNECTIONS,
                    {color: '#CC0000', lineWidth: 5});
      canvasCtx.restore();

      const meshedLocalMediaStream = canvasElement.captureStream();
      console.log("meshed canvas in OnResult", meshedLocalMediaStream);
  }

    useEffect(() => {

      const holistic = new Holistic({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }});

      holistic.setOptions({
        modelComplexity: 1,
        // selfieMode: true, 
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      holistic.onResults(onResults);

      let prevTime;

      const myVideoTag = myVideo.current;
      async function drawImage(){
        if (Date.now() - prevTime > 60) {
          prevTime = Date.now();
          if (myVideoTag.currentTime !== 0){
            const imageBitMap = await createImageBitmap(myVideoTag);
            await holistic.send({image: imageBitMap}); 
          }
        }
        window.requestAnimationFrame(drawImage);
      }

      prevTime = Date.now();
      window.requestAnimationFrame(drawImage);
        
      }, []);
        return (
          <>
            <canvas id="output_canvas" ref={canvasRef} className={classes.canvas} />
            
          </>
        );
};

export default CanvasUser;