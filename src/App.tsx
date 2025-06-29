import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from "react-flow-renderer";

type CustomNodeData = {
  value?: string;
  onChange?: (id: string, val: string) => void;
  onDelete?: (id: string) => void;
};

const inputNodeStyle: React.CSSProperties = {
  padding: 10,
  border: "1px solid #222",
  borderRadius: 5,
  background: "#ddd",
  width: 120,
  textAlign: "center",
  position: "relative",
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

function InputNode() {
  return (
    <div style={inputNodeStyle}>
      <div>Начальное число</div>
      <div style={{ fontWeight: "bold", fontSize: 20 }}>0</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

function AddNode({ data, id }: { data: CustomNodeData; id: string }) {
  const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.(id, evt.target.value);
  };

  const onDeleteClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    data.onDelete?.(id);
  };

  return (
    <div style={operationNodeStyle}>
      <div
        style={deleteButtonStyle}
        title="Удалить блок"
        onClick={onDeleteClick}
        aria-label="Удалить блок"
      >
        ×
      </div>
      <Handle type="target" position={Position.Left} id="in" />
      <div>Прибавить</div>
      <input
        type="number"
        value={data.value ?? ""}
        onChange={onChange}
        style={{ width: "100%", marginTop: 5 }}
      />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

function MultiplyNode({ data, id }: { data: CustomNodeData; id: string }) {
  const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange?.(id, evt.target.value);
  };

  const onDeleteClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    data.onDelete?.(id);
  };

  return (
    <div style={operationNodeStyle}>
      <div
        style={deleteButtonStyle}
        title="Удалить блок"
        onClick={onDeleteClick}
        aria-label="Удалить блок"
      >
        ×
      </div>
      <Handle type="target" position={Position.Left} id="in" />
      <div>Умножить на</div>
      <input
        type="number"
        value={data.value ?? ""}
        onChange={onChange}
        style={{ width: "100%", marginTop: 5 }}
      />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

const nodeTypes = {
  inputNode: InputNode,
  addNode: AddNode,
  multiplyNode: MultiplyNode,
};

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: "1",
    type: "inputNode",
    data: {},
    position: { x: 50, y: 100 },
  },
];

const initialEdges: Edge[] = [];

function App() {
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Обновление значения в узле
  const onChangeNodeValue = useCallback((id: string, val: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                value: val,
                onChange: onChangeNodeValue,
                onDelete: onDeleteNode,
              },
            }
          : node
      )
    );
  }, []);

  // Удаление узла по id
  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, []);

  // Обновим onChange и onDelete в data всех узлов кроме входного
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "addNode" || node.type === "multiplyNode") {
          return {
            ...node,
            data: {
              ...node.data,
              onChange: onChangeNodeValue,
              onDelete: onDeleteNode,
            },
          };
        }
        return node;
      })
    );
  }, [onChangeNodeValue, onDeleteNode]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Ограничение: один вход и один выход на каждый узел
  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;

      // Проверяем, нет ли уже входа у target
      const hasTargetInput = edges.some(
        (e) => e.target === target && e.targetHandle === connection.targetHandle
      );
      if (hasTargetInput) {
        alert("У этого блока уже есть вход");
        return;
      }

      // Проверяем, нет ли уже выхода у source
      const hasSourceOutput = edges.some(
        (e) => e.source === source && e.sourceHandle === connection.sourceHandle
      );
      if (hasSourceOutput) {
        alert("У этого блока уже есть выход");
        return;
      }

      setEdges((eds) => addEdge(connection, eds));
    },
    [edges]
  );

  // Добавление блоков на доску
  const addNode = (type: "addNode" | "multiplyNode") => {
    const id = (nodes.length + 1).toString();
    const newNode: Node<CustomNodeData> = {
      id,
      type,
      data: { value: "0", onChange: onChangeNodeValue, onDelete: onDeleteNode },
      position: {
        x: 50 + nodes.length * 180,
        y: 200,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Вычисление результата цепочки
  const calculateResult = () => {
    let currentId = "1";
    let result = 0;

    while (true) {
      const outgoingEdges = edges.filter((e) => e.source === currentId);
      if (outgoingEdges.length === 0) break;

      const nextId = outgoingEdges[0].target;
      const nextNode = nodes.find((n) => n.id === nextId);
      if (!nextNode) break;

      const val = parseFloat(nextNode.data.value ?? "");
      if (isNaN(val)) {
        alert("Введите число в блоке " + nextNode.id);
        return;
      }

      if (nextNode.type === "addNode") {
        result += val;
      } else if (nextNode.type === "multiplyNode") {
        result *= val;
      }

      currentId = nextId;
    }

    alert("Результат: " + result);
    console.log("Результат:", result);
  };

  return (
    <ReactFlowProvider>
      <div style={{ height: "100vh", display: "flex" }}>
        {/* Панель добавления блоков */}
        <div
          style={{
            width: 150,
            padding: 10,
            borderRight: "1px solid #ccc",
            background: "#f0f0f0",
            boxSizing: "border-box",
          }}
        >
          <h3>Добавить блок</h3>
          <button
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() => addNode("addNode")}
          >
            Прибавить
          </button>
          <button
            style={{ width: "100%" }}
            onClick={() => addNode("multiplyNode")}
          >
            Умножить
          </button>

          <div style={{ marginTop: 20 }}>
            <button onClick={calculateResult} style={{ width: "100%" }}>
              Вычислить результат
            </button>
          </div>
        </div>

        {/* Поле с React Flow */}
        <div style={{ flexGrow: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <MiniMap />
            <Controls />
            <Background gap={15} />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
