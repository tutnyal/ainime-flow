import IconComponent from "@/components/common/genericIconComponent";
import ShadTooltip from "@/components/common/shadTooltipComponent";
import useSaveFlow from "@/hooks/flows/use-save-flow";
import useFlowsManagerStore from "@/stores/flowsManagerStore";
import useFlowStore from "@/stores/flowStore";
import { cn } from "@/utils/utils";
import {
  ControlButton,
  Panel,
  useReactFlow,
  useStore,
  useStoreApi,
  type ReactFlowState,
  Node,
} from "@xyflow/react";
import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { Zap, ImageIcon, Wand2, Mic } from 'lucide-react';
import AIGenerationCard from './AIGenerationcard';
import { useAddComponent } from "@/hooks/useAddComponent";
// import { ComfyDeployClient } from "@comfy-deploy/client";


// const client = new ComfyDeployClient({
//   apiBase: "http://localhost:3000",
//   apiToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDAwNzExMTF9.-HYVZJSekJQXQ3o6XPUL9dJIfK87IoTWNFm-ZmPe3zE",
// });

// export async function simple_generate(positive_prompt: string) {
//   try {
//       console.log("Calling simple_generate with prompt:", positive_prompt);
      
//       // Define the API token
//       const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDAwNzExMTF9.-HYVZJSekJQXQ3o6XPUL9dJIfK87IoTWNFm-ZmPe3zE";
      
//       // Log the request details for debugging
//       console.log("Making request to ComfyDeploy API with:", {
//           url: "http://localhost:3000/api/run", // Use localhost instead of 127.0.0.1 to match curl
//           deploymentId: "a702ea91-9b42-4b2d-ac32-969d654c39af",
//           prompt: positive_prompt
//       });
      
//       // Use fetch with exact same parameters as the working curl command
//       // const response = await fetch("http://localhost:3000/api/run", {
//       //     method: "POST",
//       //     headers: {
//       //         "Content-Type": "application/json",
//       //         "Authorization": `Bearer ${apiToken}`
//       //         // No X-ComfyDeploy-Request header - not in the working curl
//       //     },
//       //     body: JSON.stringify({
//       //         deployment_id: "a702ea91-9b42-4b2d-ac32-969d654c39af",
//       //         inputs: {
//       //             "input_text": positive_prompt,
//       //             "input_image": ""
//       //         }
//       //     })
//       //     // No mode: 'cors' - not in the working curl
//       //     // No credentials: 'include' - not in the working curl
//       // });
      

//       const { run_id } = await client.run("a702ea91-9b42-4b2d-ac32-969d654c39af", {
//         inputs: {
//             "input_text": "",
//             "input_image": ""
//           }
//       });


//       // Log the response status for debugging
//       console.log("ComfyDeploy API response status:", run_id.status);
      
//       if (!run_id.ok) {
//           const errorText = await run_id.text();
//           console.error("API error response:", errorText);
//           throw new Error(`API request failed with status ${run_id.status}: ${run_id.statusText}`);
//       }
      
//       const data = await run_id.json();
//       console.log("simple_generate response:", data);
      
//       return data;
//   } catch (error: any) {
//       console.log("Error in simple_generate:", error);
      
//       // Detailed error logging
//       console.error('Error details:', {
//           message: error.message,
//           stack: error.stack,
//           response: error.response?.data
//       });
      
//       // Return null instead of throwing to allow the UI to handle the error
//       return null;
//   }
// }



type CustomControlButtonProps = {
  iconName: string;
  tooltipText: string;
  onClick: () => void;
  disabled?: boolean;
  backgroundClasses?: string;
  iconClasses?: string;
  testId?: string;
};



export const CustomControlButton2 = ({
  iconName,
  tooltipText,
  onClick,
  disabled,
  backgroundClasses,
  iconClasses,
  testId,
}: CustomControlButtonProps): JSX.Element => {
  return (
    <ControlButton
      data-testid={testId}
      className="!h-8 !w-8 rounded !p-0"
      onClick={onClick}
      disabled={disabled}
      title={testId?.replace(/_/g, " ")}
    >
      <ShadTooltip content={tooltipText}>
        <div className={cn("rounded p-2.5", backgroundClasses)}>
          <IconComponent
            name={iconName}
            aria-hidden="true"
            className={cn("scale-150 text-muted-foreground", iconClasses)}
          />
        </div>
      </ShadTooltip>
    </ControlButton>
  );
};

const selector = (s: ReactFlowState) => ({
  isInteractive: s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  minZoomReached: s.transform[2] <= s.minZoom,
  maxZoomReached: s.transform[2] >= s.maxZoom,
});

const CanvasControls2 = ({ children }) => {
  const store = useStoreApi();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { isInteractive, minZoomReached, maxZoomReached } = useStore(
    selector,
    shallow,
  );
  const saveFlow = useSaveFlow();
  const currentFlow = useFlowStore((state) => state.currentFlow);
  const setCurrentFlow = useFlowStore((state) => state.setCurrentFlow);
  const autoSaving = useFlowsManagerStore((state) => state.autoSaving);
  const setNodes = useFlowStore((state) => state.setNodes);
  const addComponent = useAddComponent();


  const userId = "user_dffrfrfr5455521545451ff"

  const addNode = (type: string) => {
    <AIGenerationCard userId = {userId} />

    // addComponent(
    //   {
    //     display_name: type.replace('-', ' '),
    //     description: '',
    //     documentation: '',
    //     template: {
    //       input_text: {
    //         type: "str",
    //         required: true,
    //         placeholder: "Enter text input fdffdf",
    //         list: false,
    //         show: true,
    //         readonly: false
    //       }
    //     },
    //     nodeType: 'AIGenerationNode'
    //   },
    //   'AIGenerationNode'
    // );
  };

  return (
    <Panel
      data-testid="canvas_controls"
      className="react-flow__controls !m-2 flex !flex-row gap-1.5 rounded-md border border-secondary-hover bg-background fill-foreground stroke-foreground p-1.5 text-primary shadow [&>button]:border-0 [&>button]:bg-background hover:[&>button]:bg-accent"
      position= "bottom-center"
    >
      {/* Zoom Controls */}
      <CustomControlButton2
        iconName="ZoomIn"
        tooltipText="Zoom In"
        onClick={zoomIn}
        disabled={maxZoomReached}
        testId="zoom_in"
      />
      <CustomControlButton2
        iconName="ZoomOut"
        tooltipText="Zoom Out"
        onClick={zoomOut}
        disabled={minZoomReached}
        testId="zoom_out"
      />
      <CustomControlButton2
        iconName="maximize"
        tooltipText="Fit To Zoom"
        onClick={fitView}
        testId="fit_view"
      />

      {/* AI Generation Buttons */}
      <CustomControlButton2
        iconName="maximize"
        tooltipText="Text to Video"
        onClick={() => addNode('text-to-video')}
        testId="add_text_to_video"
      />
      <CustomControlButton2
        iconName="maximize"
        tooltipText="Animate Image"
        onClick={() => addNode('animate-image')}
        testId="add_animate_image"
      />
      <CustomControlButton2
        iconName="maximize"
        tooltipText="Stylize Video"
        onClick={() => addNode('stylize-video')}
        testId="add_stylize_video"
      />
      <CustomControlButton2
        iconName= "maximize"
        tooltipText="Lipsync"
        onClick={() => addNode('make-talk')}
        testId="add_lipsync"
      />

      {children}
    </Panel>
  );
};

export default CanvasControls2;
