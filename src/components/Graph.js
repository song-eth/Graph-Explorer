import { useEffect, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

function Graph() {
  const [graphData, setGraphData] = useState({ "nodes": [], "links": []});
  const [addressETH, setAddressEth] = useState("");
  const [graphLoading, setGraphLoading] = useState(false);

  const fgRef = useRef();

  useEffect(() => {
    const fg = fgRef.current;

    // Deactivate existing forces
    fg.d3Force("link").distance((link) => 40);
    fg.d3Force("charge").strength(-200); // the default is -30
  }, []);

  function nodePaint(
    { id, x, y, name, value, code, imgSrc },
    ctx,
    globalScale
  ) {
    const fontSize = (10 / globalScale) * 2;
    ctx.font = `${fontSize}px Bai Jamjuree`;
    const textWidth = ctx.measureText(name).width;
    ctx.fillStyle = "#72eaf2"; // sets node color randomly based on ID

    let img = new Image();
    if (imgSrc) {
      img.src = imgSrc;
    }

    const imgR = (10 / globalScale) * 3;

    return (() => {
      ctx.beginPath();

      // circle
      ctx.arc(x, y, value * 2, 0, 2 * Math.PI, false);
      ctx.shadowColor = "#72eaf2";
      ctx.shadowBlur = 120;
      ctx.fill();
      ctx.shadowBlur = 0;

      // text
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#202124";
      ctx.fillText(name, x - textWidth / 2 + imgR, y);

      if (imgSrc) {
        // logo
        ctx.drawImage(
          img,
          x - imgR / 2 - textWidth / 2,
          y - imgR / 2,
          imgR,
          imgR
        );
      }
    })();
  }

  const getTransactions = async (currentAddressETH) => {
    try {
      setGraphLoading(true);
      const res = await fetch(`https://api.covalenthq.com/v1/80001/address/${currentAddressETH}/transactions_v2/?quote-currency=USD&format=JSON&block-signed-at-asc=false&no-logs=false&key=`);
      const { data } = await res.json();
      console.log(data);

      const nodes = [];
      const links = [];
      const tracks = {};

      for(let i = 0; i < 10; i++){
        if(!tracks[data.items[i].from_address]){
          console.log(tracks[ data.items[i].from_address]);
          tracks[data.items[i].from_address] =  nodes.length;
          nodes.push({
            "id": nodes.length,
            "label": data.items[i].from_address,
            "name":  data.items[i].from_address.substring(0,3) + "..." +  data.items[i].from_address.substring(39,42),
            "group": 1,
            "value": 6
          })
        }

        if(data.items[i].to_address){
          if(!tracks[data.items[i].to_address]){
            console.log(tracks[data.items[i].to_address]);
            tracks[data.items[i].to_address] = nodes.length;
            nodes.push({
              "id": nodes.length,
              "label": data.items[i].to_address,
              "name": data.items[i].to_address.substring(0,3) + "..." +  data.items[i].to_address.substring(39,42),
              "group": 1,
              "value": 6
            })
          }

          links.push({ "source": tracks[data.items[i].from_address], "target": tracks[data.items[i].to_address], "value": 1 });
        }
      }
    
      setGraphData({ nodes, links });
      console.log({ nodes, links });

      setGraphLoading(false);
    } catch (error) {
      console.error(error);
      setGraphLoading(false);
    }
  }

  const searchGraph = () => {
    getTransactions(addressETH);
  }

  return (
    <>
      <input placeholder="address" onChange={(e) => setAddressEth(e.target.value)} />
      <button onClick={searchGraph}>Search</button>
      <ForceGraph2D
        graphData={graphData} />
      {graphLoading
        ? <p>Loading...</p>
        : <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="group"
        autoPauseRedraw={false}
        linkWidth={(link) => 5}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link) => 4}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => "rgba(107, 51, 156,0.8)"}
        onBackgroundClick={() => fgRef.current.zoomToFit(1000, 100)}
        linkCurvature="curvature"
        linkColor={() => "rgba(84, 77, 77,0.8)"}
        nodeCanvasObject={(node, ctx, globalScale) =>
          nodePaint(node, ctx, globalScale)
        }
        nodeVal={(node) => node.value}
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        cooldownTicks={20}
      />
    }
    </>
  );
}

export default Graph;