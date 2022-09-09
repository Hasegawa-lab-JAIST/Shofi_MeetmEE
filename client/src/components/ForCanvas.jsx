import React, { useContext, useRef, useEffect } from "react";
import { Grid, Typography, Paper} from '@material-ui/core';
import Webcam from "react-webcam";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";

import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import * as cam from "@mediapipe/camera_utils";
// import { Camera } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    video: {
      width: '550px',
      display: 'flex',
      zIndex:9,
    },
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
    gridContainer: {
      justifyContent: 'center',
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
      },
    },
    paper: {
      padding: '10px',
      border: '2px solid black',
      margin: '10px',
    },
}));

const ForCanvas = (props) => {   
    const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
    const classes = useStyles();
    const canvasRef = useRef();

    const myVideoElement = myVideo.current;
    console.log("stream myvideo", myVideoElement);

    // // =======================================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
    // // var camera = null;
       
    function onResults(results){
      // if (typeof userVideo.current !== "undefined") {
      //   var id = "userVideoId";
      // } else {
      //   id = "myVideoId";
      // }
      // console.log(results);
      // const videoElement = document.getElementById("myVideoId");
      const videoElement = myVideoElement;
      const videoWidth = videoElement.current.video.videoWidth;
      const videoHeight = videoElement.current.video.videoHeight;
  
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

      // if (typeof userVideo.current !== "undefined") {
      //     var id = "userVideoId";
      //   } else {
      //     id = "myVideoId";
      //   }

      const videoElement = myVideoElement;
      console.log('Video Element 1:', videoElement);

      const camera = new cam.Camera(videoElement, {
        onFrame: async () => {
          await holistic.send({image: videoElement});
        },
        width: 640,
        height: 480,
      });
      camera.start();

    }, []);

    return (
      <Grid container className={classes.gridContainer}> 
          {/* Our own video */}
          { stream && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
                        <video id="myVideoId"  playsInline muted ref={myVideo} autoPlay className={classes.video}/>
                        {/* <Button id="btnPrediction" variant="contained" color="primary">Prediction</Button>  */}
                    </Grid>
                </Paper>
            )}
            
            {/* User's video */}
            {callAccepted && !callEnded && (
                <Paper className={classes.paper}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                        <video id="userVideoId" playsInline ref={userVideo} autoPlay className={classes.video} />
                    </Grid>
                </Paper>
            )}
        </Grid>
        
    );
    // ReactDOM.render(
    //   <ForCanvas />,
    //   document.getElementById("app")
    // )
};

export default ForCanvas;