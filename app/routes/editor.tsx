import { useNavigate } from 'react-router';
import type { Route } from "./+types/editor";
import MIPSCodeEditor from '../components/MIPSCodeEditor';
import { useProcessor } from '../core/processorContext';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MIPSim — Editor" },
    { name: "description", content: "Write and load MIPS assembly programs" },
  ];
}

export default function EditorPage() {
  const navigate = useNavigate();
  const { loadInstructions, code, setCode, reset } = useProcessor();

  const handleAfterLoad = () => {
    reset();
    navigate('/simulator');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <MIPSCodeEditor
        onLoadInstructions={loadInstructions}
        code={code}
        onCodeChange={setCode}
        onAfterLoad={handleAfterLoad}
      />
    </div>
  );
}
