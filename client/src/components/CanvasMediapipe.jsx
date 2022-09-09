import React, { useContext, useRef, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";

import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import * as cam from "@mediapipe/camera_utils";

const useStyles = makeStyles(() => ({
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
}));

const CanvasMediapipe = () => {
    const { myVideo, userVideo } = useContext(SocketContext);
    const classes = useStyles();
    const canvasRef = useRef();
    // let videoElement;
    console.log("MyVideo canvas (outside useEffect),", myVideo.current);
    console.log("UserVideo canvas (outside useEffect),", userVideo.current);
 
    // =======================================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
    
    // useEffect(() => {
    //   const waitUserVideo = async () => {
    //     const videoElement = await document.getElementById("userVideoId");
    //     console.log("User video", videoElement);
    //   } 
    //   waitUserVideo().catch(console.error);
    // }, []);

    function onResults(results){
      if (typeof userVideo.current !== "undefined") {
        var id = "userVideoId";
      } else {
        id = "myVideoId";
      }

      // console.log(results);
      const videoElement = document.getElementById(id);
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      // console.log('Video width, height >', videoWidth, videoHeight)

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
                    {color: '#00CC00', lineWidth: 5});
      canvasCtx.restore();
    // }
  }

    useEffect(() => {
      // const waitVideo = async () => {
      //   document.getElementById("myVideoId");
      // } 
      // waitVideo().catch(console.error);

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

      if (typeof userVideo.current !== "undefined") {
        var id = "userVideoId";
      } else {
        id = "myVideoId";
      }

      const videoElement = document.getElementById(id);
      // const videoElement = myVideo.current;
      console.log('myVideo canvas (inside useEffect):', myVideo.current);
      console.log('userVideo canvas (inside useEffect):', userVideo.current);

      const camera = new cam.Camera(videoElement, {
        onFrame: async () => {
          await holistic.send({image: videoElement});
        },
        width: 640,
        height: 480,
      });
      camera.start();   

      // =========Another way to send images for prediction=======
      // videoElement.current.onChange = async function (e){
      //   const img = new Image();
      //     img.onload = async function (){
      //       var s_time = new Date();
      //       await holistic.send({image: img});
      //       var e_time = new Date();
      //       console.log('the image is drawn:' + (e_time.getTime() - s_time.getTime()));
      //   }
      //   // eslint-disable-next-line
      //   img.src = URL.createObjectURL(e.target.files[0]);
      //   e.target.value='';
      // }
     
      // eslint-disable-next-line
      }, []);
      
    return (
      <>
        <canvas ref={canvasRef} id='canvasId' className={classes.canvas} />
      </>
    );
};

export default CanvasMediapipe;