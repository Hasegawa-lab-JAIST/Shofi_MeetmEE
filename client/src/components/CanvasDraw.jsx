import React, { useContext, useRef, useEffect, useState } from "react";
import { Grid, Typography, Paper} from '@material-ui/core';
import Webcam from "react-webcam";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";

import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import * as cam from "@mediapipe/camera_utils";
import { Camera } from "@material-ui/icons";

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

const CanvasDraw = () => {
    const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
    const classes = useStyles();

    const canvasRef = useRef();
    // =======================================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
    var camera = null;

    function onResults(results){
      // console.log(results);
      const videoWidth = myVideo.current.video.videoWidth;
      const videoHeight = myVideo.current.video.videoHeight;
  
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

      camera = new cam.Camera(myVideo.current.video, {
        onFrame: async () => {
          await holistic.send({image: myVideo.current.video});
        },
        width: 640,
        height: 480,
      });
      camera.start();
  
    }, []);

    return (
      <Grid container className={classes.gridContainer}> 
          {/* Our own video */}
          <Paper className={classes.paper}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
              {/* {stream && (
                <video playsInline muted ref={myVideo} autoPlay className={classes.video} />
              )} */}
              <Webcam playsInline muted ref={myVideo} autoPlay className={classes.video} />
              <canvas ref={canvasRef} className={classes.canvas} />
            </Grid>
          </Paper>
            
          {/* User's video */}
          {callAccepted && !callEnded && (
            <Paper className={classes.paper}>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
                <video playsInline ref={userVideo} autoPlay className={classes.video} />
              </Grid>
            </Paper>
          )}
        </Grid>
        
    );
};

export default CanvasDraw;