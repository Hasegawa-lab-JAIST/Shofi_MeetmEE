import React, { useContext, useRef, useEffect, useState  } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";
import axios from 'axios';
import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import { Typography, Button, Grid} from '@material-ui/core';
import { LineChart, Line, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const useStyles = makeStyles(() => ({
    canvas: {
      width: '550px',
      marginTop:"-200%",
      marginBottom:"4%"
    },
}));

// Extract image
function encodeImageBitmapToBase64(imageBitmap) {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);

  const dataURL = canvas.toDataURL('image/png');
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
}

// For live graph
function formatYAxis(value) {
  if(value === 0) return "Not Engaged"
  if(value === 0.5) return "Normal Engaged"
  if(value === 1) return "Very Engaged"
  return ""
}

function formatEngagement(value) {
  if(value === "NotEngaged") return 0
  if(value === "NormalEngaged") return 0.5
  if(value === "VeryEngaged") return 1
  return 0
}

const CanvasTheirs = (props) => {
    const {userVideo } = useContext(SocketContext);
    const canvasRef = useRef();

  // ---------For live graph------------      
    const [response, setResponse] = useState(null);
    const [chartData, setChartData] = useState([
      {
        "engagement": 0,
      },
      {
        "engagement": 0.5,
      },
      {
        "engagement": 1,
      }
    ]);

    // ---------Flag for turn on/off button------------
    const [isMeshOn, setIsMeshOn] = useState(false);
    const [isPredictOn, setIsPredictOn] = useState(false);
    const [frameId, setFrameId] = useState(0);
    const classes = useStyles();    

    const handleMesh = () => {
      if (isMeshOn) {
        cancelAnimationFrame(frameId)
      }
      setIsMeshOn(!isMeshOn);
    };
    
    const handlePredict = () => {
      if (isPredictOn) {
        cancelAnimationFrame(frameId)
      }
      setIsPredictOn(!isPredictOn);
    };
    // =======================================Holistic Mediapipe===========================
    const connect = window.drawConnectors;
  
    function onResults(results, m, p){
      const videoElement = document.getElementById(props.id);
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

      if (m){
        console.log("Mesh peer running")
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
      
      // send image for prediction
      if (p){
        console.log("Prediction client running")
        const currentTime = new Date();
        const timestamp = currentTime.getTime().toString()
        if (parseInt(timestamp.substring(timestamp.length - 3)) <= 20) {
          console.log("Request sent at: ", timestamp);
          const encodedImage = encodeImageBitmapToBase64(results.image);
          if (timestamp) {
            axios.post('http://localhost:5050/api', { encodedImage, timestamp }).then((response) => {
              console.log("Response:", response.data);
              setResponse(response.data);
              // Step 2 - Realtime Engagement Chart
              setChartData(oldChartData => [...oldChartData, {"engagement": formatEngagement(response.data.class)}]);
            });
          } 
        }
      }
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
      holistic.onResults(r => onResults(r,isMeshOn, isPredictOn) );

      let prevTime;
      let id; // Get animation frame ID so we can stop it through handleMesh event
      const userVideoTag = userVideo.current;
      async function drawImage(){
        if (Date.now() - prevTime > 60) {
          prevTime = Date.now();
          if (userVideoTag.currentTime !== 0){
            const imageBitMap = await createImageBitmap(userVideoTag);
            await holistic.send({image: imageBitMap}); 
          }
        }
        id = window.requestAnimationFrame(drawImage);
        setFrameId(id)
      }

      userVideoTag.play();
      prevTime = Date.now();
      window.requestAnimationFrame(drawImage);
      setFrameId(id)
        // // update prediction every 1s.
        // setInterval(() => {
        //   holistic.send({image: userVideo.current});
        // },1000); 
     
      }, [isMeshOn, isPredictOn]);
    
      return (
        <>
        {props.id === "userVideoId"}
          <canvas ref={canvasRef} id='canvasId' className={classes.canvas} />
          {response && (
              <div>
                <Typography variant="h5" gutterBottom>Engagement: {response.class}</Typography>
                <Typography variant="h5" gutterBottom>Prediction Probability: {response.prob}</Typography>
              </div>        
            )}
            {response && chartData && (
                <div style={{ marginTop: "10px"}}>
                  <LineChart width={500} height={250} data={chartData}
                  margin={{ top: 5, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <YAxis tick= {{ transform: "translate(0, 4)" }} tickFormatter={formatYAxis} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="engagement" stroke="#82ca9d" />
                  </LineChart>
                </div>
            )}

            <div>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button variant="contained" color={isMeshOn ? "secondary": "primary"} onClick={handleMesh}>
                    Turn {isMeshOn ? 'off' : 'on'} Face Mesh
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="contained" color={isPredictOn ? "secondary": "primary"} onClick={handlePredict}>
                    Turn {isPredictOn ? 'off' : 'on'} Prediction
                  </Button>
                </Grid>
              </Grid>
            </div>
        </>
      );
};

export default CanvasTheirs;