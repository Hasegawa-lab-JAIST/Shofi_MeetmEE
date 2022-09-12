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

const CanvasMediapipe = (props) => {
    const classes = useStyles();
    const canvasRef = useRef();
    const canvasRefUser = useRef();
    const { userVideo } = useContext(SocketContext);
    const connect = window.drawConnectors;
    function onResults(results){
      var cr ='';
      if (props.id == 'myVideoId'){
        cr = canvasRef;
      } 
      if (props.id == 'userVideoId'){
        cr = canvasRefUser;
      }
      const videoElement = document.getElementById(props.id);
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      cr.current.width = videoWidth;
      cr.current.height = videoHeight;
      const canvasElement = cr.current;
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
    }

    useEffect(() => {
      const holisticUser = new Holistic({locateFile: (file) => {
        // console.log(file)
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }});
      holisticUser.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      const holistic = new Holistic({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }});
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      if (props.id == "myVideoId"){
        holistic.onResults(onResults);
        const videoElement = document.getElementById("myVideoId");
        const camera = new cam.Camera(videoElement, {
          onFrame: async () => {
            await holistic.send({image: videoElement});
          },
          width: 640,
          height: 480,
        });
        camera.start(); 
      }

      if (props.id == "userVideoId"){
          holisticUser.onResults(onResults);
          const videoElement = document.getElementById("userVideoId");
          // holisticUser.send({image: videoElement});

          if (videoElement.current){
            videoElement.current.onChange = async function (e){
              const img = new Image();
                img.onload = async function (){
                  var s_time = new Date();
                  await holistic.send({image: img});
                  var e_time = new Date();
                  console.log('the image is drawn:' + (e_time.getTime() - s_time.getTime()));
              }
              // eslint-disable-next-line
              img.src = URL.createObjectURL(e.target.files[0]);
              e.target.value='';
          }
      }
        }
      }, []); // End of UseEffect
    if (props.id == "myVideoId") {
      return <canvas ref={canvasRef} id='canvasId' className={classes.canvas} />
    } 
    
    if (props.id == "userVideoId") {
      return <canvas ref={canvasRefUser} id='canvasUserId' className={classes.canvas} />
    } 
};

export default CanvasMediapipe;