import React, { useRef, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";

import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
<<<<<<< Updated upstream
// import * as cam from "@mediapipe/camera_utils";
=======
import * as cam from "@mediapipe/camera_utils";
>>>>>>> Stashed changes

const useStyles = makeStyles(() => ({
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
}));

const CanvasMediapipe = (props) => {
    const { myVideo,userVideo } = useContext(SocketContext);
    const classes = useStyles();
    const canvasRef = useRef();
    const canvasRefuser = useRef();
 
    // ======================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
    
    function onResults(results){
      if (props.id === "myVideoId"){
        var video = myVideo;
        var cr = canvasRef;
      }

      if (props.id === "userVideoId"){
        video = userVideo;
        cr = canvasRefuser;
      }
      // console.log(results);

      const videoElement = video.current;
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      // console.log('Video width, height >', videoWidth, videoHeight)

      // Set canvas width
      cr.current.width = videoWidth;
      cr.current.height = videoHeight;
  
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
    // }
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

<<<<<<< Updated upstream
      let prevTime;
      const myVideoTag = myVideo.current;
      async function drawImage(){
        if (Date.now() - prevTime > 60) {
          prevTime = Date.now();
          if (myVideoTag.currentTime !== 0){
            const imageBitMap = await createImageBitmap(myVideoTag);
            await holistic.send({image: imageBitMap}); 
=======
      // let prevTime;
      // const myVideoTag = myVideo.current;
      // async function drawImage(){
      //   if (Date.now() - prevTime > 60) {
      //     prevTime = Date.now();
      //     if (myVideoTag.currentTime !== 0){
      //       const imageBitMap = await createImageBitmap(myVideoTag);
      //       await holistic.send({image: imageBitMap}); 
      //     }
      //   }
      //   window.requestAnimationFrame(drawImage);
      // }

      // myVideoTag.play();
      // prevTime = Date.now();
      // window.requestAnimationFrame(drawImage);
        
      if(props.id === "myVideoId"){
        holistic.onResults(onResults);
        const camera = new cam.Camera(myVideo.current, {
          onFrame: async () => {
            await holistic.send({image: myVideo.current});
          },
          width: 640,
          height: 480,
        });
        camera.start();   
      }

      if (props.id === "userVideoId"){
        holistic.onResults(onResults);
        let prevTime;
        const myVideoTag = userVideo.current;
        async function drawImage(){
          if (Date.now() - prevTime > 60) {
            prevTime = Date.now();
            if (myVideoTag.currentTime !== 0){
              const imageBitMap = await createImageBitmap(myVideoTag);
              await holistic.send({image: imageBitMap}); 
            }
>>>>>>> Stashed changes
          }
          window.requestAnimationFrame(drawImage);
        }
  
        myVideoTag.play();
        prevTime = Date.now();
        window.requestAnimationFrame(drawImage);
        // update prediction every 1s.
        // setInterval(() => {
        //   holistic.send({image: userVideo.current});
        // },2000);
      }
<<<<<<< Updated upstream

      myVideoTag.play();

      prevTime = Date.now();
      window.requestAnimationFrame(drawImage);
        
      // if(props.id === "myVideoId"){
      //   holistic.onResults(onResults);
      //   const camera = new cam.Camera(myVideo.current, {
      //     onFrame: async () => {
      //       await holistic.send({image: myVideo.current});
      //     },
      //     width: 640,
      //     height: 480,
      //   });
      //   camera.start();   
      // }

      // if (props.id === "userVideoId"){
      //   holistic.onResults(onResults);
      //   // update prediction every 1s.
      //   setInterval(() => {
      //     holistic.send({image: userVideo.current});
      //   },2000);
      // }
=======
>>>>>>> Stashed changes
      }, []);
    
      if (props.id === "myVideoId"){
        return (
          <>
          {/* {props.id === "myVideoId"} */}
            <canvas ref={canvasRef} className={classes.canvas} />
          </>
        );
      }

      if (props.id === "userVideoId"){
        return (
          <>
          {/* {props.id === "myVideoId"} */}
            <canvas ref={canvasRefuser} className={classes.canvas} />
          </>
        );
      }
};

export default CanvasMediapipe;