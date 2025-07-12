import React, { useState, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  applyNodeChanges,
  Node,
  NodeChange,
  NodeProps,
  useReactFlow,
} from "react-flow-renderer";

const inputNodeStyle: React.CSSProperties = {
  padding: 10,
  border: "1px solid #222",
  borderRadius: 5,
  background: "#ddd",
  width: 120,
  textAlign: "center",
};

const operationNodeStyle: React.CSSProperties = {
  padding: 10,
  border: "2px solid #007bff",
  borderRadius: 5,
  background: "#e6f0ff",
  width: 160,
  textAlign: "center",
  position: "relative",
};

const deleteButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 2,
  right: 4,
  cursor: "pointer",
  fontWeight: "bold",
  color: "#c00",
  fontSize: 18,
  userSelect: "none",
};

type CustomData = {
  value?: string;
  onChange?: (id: string, val: string) => void;
  onDelete?: (id: string) => void;
};

const InputNode = () => {
  return (
    <div style={inputNodeStyle}>
      <div>Начальное число</div>
      <div style={{ fontWeight: "bold", fontSize: 20 }}>0</div>
    </div>
  );
};

const AddNode = ({ id, data }: NodeProps<CustomData>) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.(id, e.target.value);
  };
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(id);
  };
  return (
    <div style={operationNodeStyle}>
      <div style={deleteButtonStyle} onClick={onDelete}>
        ×
      </div>
      <div>Прибавить</div>
      <input
        type="number"
        value={data.value ?? ""}
        onChange={onChange}
        style={{ width: "100%", marginTop: 5 }}
      />
    </div>
  );
};

const MultiplyNode = ({ id, data }: NodeProps<CustomData>) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.(id, e.target.value);
  };
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(id);
  };
  return (
    <div style={operationNodeStyle}>
      <div style={deleteButtonStyle} onClick={onDelete}>
        ×
      </div>
      <div>Умножить на</div>
      <input
        type="number"
        value={data.value ?? ""}
        onChange={onChange}
        style={{ width: "100%", marginTop: 5 }}
      />
    </div>
  );
};

const nodeTypes = {
  inputNode: InputNode,
  addNode: AddNode,
  multiplyNode: MultiplyNode,
};

const initialNodes: Node<CustomData>[] = [
  {
    id: "1",
    type: "inputNode",
    position: { x: 50, y: 100 },
    data: {},
  },
];

export default function App() {
  const [nodes, setNodes] = useState<Node<CustomData>[]>(initialNodes);
  const [connections, setConnections] = useState<{ [key: string]: string }>({});

  const onChangeNodeValue = useCallback((id: string, val: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, value: val } } : n
      )
    );
  }, []);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setConnections((conns) => {
      const newConns = { ...conns };
      delete newConns[id];
      for (const key in newConns) {
        if (newConns[key] === id) delete newConns[key];
      }
      return newConns;
    });
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const snapDistance = 40;
      const thisNode = node;

      for (const other of nodes) {
        if (other.id === thisNode.id) continue;

        const dx = thisNode.position.x - (other.position.x + 160);
        const dy = thisNode.position.y - other.position.y;

        if (Math.abs(dx) < snapDistance && Math.abs(dy) < snapDistance) {
          const newX = other.position.x + 160;
          const newY = other.position.y;

          setNodes((nds) =>
            nds.map((n) =>
              n.id === thisNode.id
                ? { ...n, position: { x: newX, y: newY } }
                : n
            )
          );

          setConnections((conns) => ({ ...conns, [other.id]: thisNode.id }));
          return;
        }
      }
    },
    [nodes]
  );

  const addNode = (type: "addNode" | "multiplyNode") => {
    const id = (nodes.length + 1).toString();
    const newNode: Node<CustomData> = {
      id,
      type,
      position: { x: 100 + nodes.length * 180, y: 200 },
      data: { value: "0", onChange: onChangeNodeValue, onDelete: onDeleteNode },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const calculateResult = () => {
    let result = 0;
    let currentId = "1";

    while (connections[currentId]) {
      const nextId = connections[currentId];
      const node = nodes.find((n) => n.id === nextId);
      if (!node) break;

      const val = parseFloat(node.data.value ?? "");
      if (isNaN(val)) {
        alert("Введите число в блоке " + nextId);
        return;
      }

      if (node.type === "addNode") result += val;
      else if (node.type === "multiplyNode") result *= val;

      currentId = nextId;
    }

    alert("Результат: " + result);
  };

  return (
    <ReactFlowProvider>
      <div style={{ height: "100vh", display: "flex" }}>
        <div
          style={{
            width: 150,
            padding: 10,
            borderRight: "1px solid #ccc",
            background: "#f0f0f0",
          }}
        >
          <h3>Добавить блок</h3>
          <button onClick={() => addNode("addNode")}>Прибавить</button>
          <button
            onClick={() => addNode("multiplyNode")}
            style={{ marginTop: 5 }}
          >
            Умножить
          </button>
          <button onClick={calculateResult} style={{ marginTop: 20 }}>
            Вычислить результат
          </button>
        </div>

        <div style={{ flexGrow: 1 }}>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                onChange: onChangeNodeValue,
                onDelete: onDeleteNode,
              },
            }))}
            edges={[]}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
