import { useCallback, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Zap, ImageIcon, Wand2, Mic } from 'lucide-react';
import ShadTooltip from "@/components/common/shadTooltipComponent";
import IconComponent from "@/components/common/genericIconComponent";
import useFlowStore from "../../../stores/flowStore";
// import { useFlowStore } from "@/stores/flowStore";
// import GenericNode from "../GenericNode";
import { NodeDataType } from "../../../types/flow";
import GenericNode from "../../../CustomNodes/GenericNode";
import NodeStatus from "../../../CustomNodes/GenericNode/components/NodeStatus";
import AIGenerationCard from "./AIGenerationcard";

const AIGenerationNode = ({ data, selected }: { data: NodeDataType; selected?: boolean }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { type, node } = data;
  const userId = "user_dffrfrfr5455521545451ff";

  const getIcon = useCallback(() => {
    switch(type) {
      case 'text-to-video':
        return <Zap size={20} />;
      case 'animate-image':
        return <ImageIcon size={20} />;
      case 'stylize-video':
        return <Wand2 size={20} />;
      case 'make-talk':
        return <Mic size={20} />;
      default:
        return <Zap size={20} />;
    }
  }, [type]);

  // const handleGenerate = async () => {
  //   setIsLoading(true);
  //   setStatus(null);
  //   try {
  //     const response = await fetch('/api/generate', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         type,
  //         input: inputText
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Generation failed');
  //     }

  //     const result = await response.json();
      
  //     // Update node with result
  //     setNodes((nds) => nds.map((n) => {
  //       if (n.id === data.id) {
  //         return {
  //           ...n,
  //           data: {
  //             ...n.data,
  //             result
  //           }
  //         };
  //       }
  //       return n;
  //     }));

  //     setStatus({ type: 'success', message: 'Generation completed successfully' });
  //   } catch (error) {
  //     setStatus({ type: 'error', message: 'Generation failed' });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="relative">
      {/* Directly render the AIGenerationCard */}
      <AIGenerationCard userId={userId} />

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable
        className="!bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable
        className="!bg-primary"
      />

      {/* Status display */}
      {status && (
        <NodeStatus
          nodeId={data.id}
          display_name={node.display_name}
          setBorderColor={() => {}}
          showNode={true}
          data={data}
          buildStatus={status.type === 'success' ? 'success' : 'error'}
          isOutdated={false}
          isUserEdited={false}
          getValidationStatus={() => null}
          handleUpdateComponent={() => {}}
        />
      )}
    </div>
  );
};

export default AIGenerationNode;