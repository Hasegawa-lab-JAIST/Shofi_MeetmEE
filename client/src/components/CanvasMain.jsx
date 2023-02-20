import React, { useRef, useEffect, useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SocketContext } from "../SocketContext";
import axios from 'axios';
import {Holistic} from '@mediapipe/holistic';
import * as HOLISTIC from '@mediapipe/holistic';
import { Typography} from '@material-ui/core';
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

const CanvasMine = (props) => {
    const { myVideo } = useContext(SocketContext);
    const classes = useStyles();
    const canvasRef = useRef();
    // const canvasRefuser = useRef();

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
    // ======================Holistic Mediapipe===========================
    const connect = window.drawConnectors;

    function onResults(results){
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

      // Step 1 - Send to prediction function and get the label and prob ()
      // Sol1: Just JS (does not work)
      // Sol2: Send landmark to python and get the class and prob
      // axios.post(`http://localhost:5050/api`, {
      //   landmark_from_js: results,
      // })
      // .then(res => {
      //   const predict_from_py = res.data;
      //   console.log(predict_from_py.class)
      //   console.log(predict_from_py.prob)
      // })
      // Sol3: Send video instead landmark
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

    useEffect(() => {
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

      myVideoTag.play();
      prevTime = Date.now();
      window.requestAnimationFrame(drawImage);

      }, []);
        return (
          <>
          {props.id === "myVideoId"}
            <canvas ref={canvasRef} className={classes.canvas} />
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
          </>
        );
};

export default CanvasMine;