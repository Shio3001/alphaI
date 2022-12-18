import * as React from "react";
const { useContext, useReducer, createContext, useState, useEffect, useRef } = React;
import { createRoot } from "react-dom/client";
import { isFormElement } from "react-router-dom/dist/dom";

const markerSize = 40;

type TypeRawViewImageSize = {
  rawWidth: number;
  rawWeight: number;
  viewWidth: number;
  viewHeight: number;
};

type TypeImageSize = {
  width: number;
  height: number;
};

type TypePosition = {
  x: number;
  y: number;
};

class ShapePointPostionClass {
  x: number;
  y: number;

  clickViewPos: TypePosition;
  clickMousePos: TypePosition;

  constructor(nx = 0, ny = 0) {
    this.x = nx;
    this.y = ny;

    this.clickViewPos = { x: null, y: null };
    this.clickMousePos = { x: null, y: null };
  }
}

interface TypeActionShapePostion {
  type: string;
}

// TypeActionShapePostionClickPush | TypeActionShapePostionClickMove
interface TypeActionShapePostionClickPush extends TypeActionShapePostion {
  targetIndex: number;
  clickViewPos: TypePosition;
  clickMousePos: TypePosition;
}

interface TypeActionShapePostionClickMove extends TypeActionShapePostion {
  targetIndex: number;
  mousePos: TypePosition;
}
interface TypeActionShapePostionClickUp extends TypeActionShapePostion {
  targetIndex: number;
}

interface TypeActionShapePostionSetup extends TypeActionShapePostion {
  width: number;
  height: number;
}

type TypeAppContext = {
  imageBaseURL: string;
  setImageBaseURL: Function;
  imageRawViewSize: TypeRawViewImageSize;
  dispatchImageRawViewSize: Function;

  shapePostion: Array<ShapePointPostionClass>;
  dispatchShapePostion: Function;
};
export const AppContext = createContext<TypeAppContext>({} as TypeAppContext);

const getWindowSize = () => {
  return [window.innerWidth, window.innerHeight];
};

const getMousePosition = (
  //mediaObjectに対してMouseの座標を取得
  event: any,
  imgElement: any
  //   timelineScrollElement: any
) => {
  const clientX = event.clientX;
  const clientY = event.clientY;

  const ElementBoundingClientRect = imgElement.current.getBoundingClientRect();

  const ElementLeft = ElementBoundingClientRect.left;
  const ElementTop = ElementBoundingClientRect.top;

  const mouseAreaX = clientX - ElementLeft;
  const mouseAreaY = clientY - ElementTop;

  return { x: mouseAreaX, y: mouseAreaY };
};

const markerText = ["左上", "右上", "右下", "左下"];
const markerMoveFlag = [false, false, false, false];

const Marker = (props: { postion: ShapePointPostionClass; index: number; editAreaRef: any }) => {
  const AppContextValue = useContext(AppContext);

  const onMouseDown = (event: any) => {
    const dispatch: TypeActionShapePostionClickPush = {
      type: "clickPush",
      targetIndex: props.index,
      clickViewPos: { x: props.postion.x, y: props.postion.y },
      clickMousePos: getMousePosition(event, props.editAreaRef),
    };
    AppContextValue.dispatchShapePostion(dispatch);
  };
  const onMove = (event: any) => {
    if (!markerMoveFlag[props.index]) {
      // console.log("返送A", props.index, AppContextValue.shapePostion[props.index]);
      return;
    }

    const dispatch: TypeActionShapePostionClickMove = {
      type: "clickMove",
      targetIndex: props.index,
      mousePos: getMousePosition(event, props.editAreaRef),
    };
    AppContextValue.dispatchShapePostion(dispatch);
  };

  const onUp = () => {
    if (!markerMoveFlag[props.index]) {
      // console.log("返送B", props.index);
      return;
    }

    const dispatch: TypeActionShapePostionClickUp = {
      type: "clickUp",
      targetIndex: props.index,
    };
    AppContextValue.dispatchShapePostion(dispatch);
  };

  useEffect(() => {
    // console.log("構築")
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      // console.log("再構築");
      // イベントの設定解除
      // document.removeEventListener('click', countUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      className="marker"
      onMouseDown={onMouseDown}
      style={{ left: props.postion.x - markerSize / 2, top: props.postion.y - markerSize / 2, width: markerSize, height: markerSize }}
    >
      <span> {markerText[props.index]}</span>
    </div>
  );
};

const MarkerMap = (props: any) => {
  const AppContextValue = useContext(AppContext);

  // console.log(AppContextValue.shapePostion.length);

  return (
    <>
      {AppContextValue.shapePostion.map((output, index) => (
        <Marker editAreaRef={props.editAreaRef} postion={output} index={index} key={index} />
      ))}
    </>
  );
};

const ApplyImgaeButton = () => {
  const AppContextValue = useContext(AppContext);

  const applyImgae = (event: any) => {
    const files = event.currentTarget.files;
    if (!files || files?.length === 0) return; //選択されたファイルが存在しないとき
    const file = files[0];

    const image = new Image();
    image.onload = function () {
      const rawWidhth = image.naturalWidth;
      const rawHeight = image.naturalHeight;
      // console.log(rawWidhth, rawHeight);
      AppContextValue.dispatchImageRawViewSize({ width: rawWidhth, height: rawHeight });
    };
    image.src = URL.createObjectURL(file);

    const reader = new FileReader();
    // 3. 読み込みクラスの準備が終わった後、画像の情報を設定
    reader.onload = function () {
      const imageURL: string = String(this.result);
      AppContextValue.setImageBaseURL(imageURL);
    };
    // 6. 読み込んだ画像ファイルをURLに変換
    reader.readAsDataURL(file);
  };

  return <input type="file" name="imageData" accept="image/*" onChange={applyImgae} />;
};

const ViewImage = () => {
  const AppContextValue = useContext(AppContext);

  useEffect(() => {
    // console.log("ViewCanvas", AppContextValue.imageBaseURL);
  }, [AppContextValue.imageBaseURL]);

  return (
    <img
      src={AppContextValue.imageBaseURL}
      className="viewImage"
      style={{ width: AppContextValue.imageRawViewSize.viewWidth, height: AppContextValue.imageRawViewSize.viewHeight }}
    ></img>
  );
};

const EditArea = () => {
  const AppContextValue = useContext(AppContext);

  const editAreaRef = useRef(null);

  return (
    <div
      className="editArea"
      ref={editAreaRef}
      style={{ width: AppContextValue.imageRawViewSize.viewWidth, height: AppContextValue.imageRawViewSize.viewHeight }}
    >
      <MarkerMap editAreaRef={editAreaRef} />
    </div>
  );
};

const App = () => {
  const [imageBaseURL, setImageBaseURL] = useState<string>(null);
  const [visibleMaker, setVisibleMarker] = useState(0); //0:見えない 1:領域表示 2:マーカー表示 3:マーカーと領域を表示

  const setShapePostion = (
    state: Array<ShapePointPostionClass>,
    action: TypeActionShapePostionClickPush | TypeActionShapePostionClickMove | TypeActionShapePostionSetup
  ) => {
    const newState = [...state];

    if (action.type === "clickPush") {
      const naction = action as TypeActionShapePostionClickPush;
      // console.log("clickPush", naction.targetIndex);
      // console.log("clickPush", naction.clickMousePos);
      markerMoveFlag[naction.targetIndex] = true;
      newState[naction.targetIndex].clickViewPos = naction.clickViewPos;
      newState[naction.targetIndex].clickMousePos = naction.clickMousePos;

      console.log("nactionA", naction.targetIndex, naction, newState);

      return newState;
    }
    if (action.type === "clickMove") {
      const naction = action as TypeActionShapePostionClickMove;
      // console.log("clickMove", naction.targetIndex);

      const mouseMoveX = naction.mousePos.x - state[naction.targetIndex].clickMousePos.x;
      const mouseMoveY = naction.mousePos.y - state[naction.targetIndex].clickMousePos.y;
      newState[naction.targetIndex].x = mouseMoveX + newState[naction.targetIndex].clickViewPos.x;
      newState[naction.targetIndex].y = mouseMoveY + newState[naction.targetIndex].clickViewPos.y;
      console.log("nactionB", naction.targetIndex, naction, newState);

      return newState;
    }
    if (action.type === "clickUp") {
      const naction = action as TypeActionShapePostionClickUp;

      markerMoveFlag[naction.targetIndex] = false;

      console.log("nactionC", naction.targetIndex, naction, newState);

      return newState;
    }

    if (action.type === "imageSetup") {
      const naction = action as TypeActionShapePostionSetup;

      const posArray = [
        new ShapePointPostionClass(naction.width * 0.2, naction.height * 0.2),
        new ShapePointPostionClass(naction.width * 0.8, naction.height * 0.2),
        new ShapePointPostionClass(naction.width * 0.8, naction.height * 0.8),
        new ShapePointPostionClass(naction.width * 0.2, naction.height * 0.8),
      ];

      console.log("nactionA", posArray);

      // console.log("posArray", posArray);
      setVisibleMarker(2);

      return posArray;
    }

    return state;
  };
  const [shapePostion, dispatchShapePostion] = useReducer(setShapePostion, [
    new ShapePointPostionClass(0, 0),
    new ShapePointPostionClass(0, 0),
    new ShapePointPostionClass(0, 0),
    new ShapePointPostionClass(0, 0),
  ]);

  const setImageRawViewSize = (state: TypeRawViewImageSize, action: TypeImageSize) => {
    // console.log("action", action);

    const maxWidthSize = getWindowSize()[0] * 0.9;
    const maxHeightSize = getWindowSize()[1] * 0.9;

    const reductionRate = Math.min(maxWidthSize / action.width, maxHeightSize / action.height);
    // 圧縮必要率 圧縮が必要になると1未満になり、拡大が必要になると1以上になる

    const nwidth = action.width * reductionRate;
    const nheight = action.height * reductionRate;

    // console.log("rawWidth", action.width, "rawWeight", action.height, "viewWidth", nwidth, "viewHeight", nheight);

    dispatchShapePostion({ type: "imageSetup", width: nwidth, height: nheight });

    return { rawWidth: action.width, rawWeight: action.height, viewWidth: nwidth, viewHeight: nheight };
  };
  const [imageRawViewSize, dispatchImageRawViewSize] = useReducer(setImageRawViewSize, { rawWidth: 0, rawWeight: 0, viewWidth: 0, viewHeight: 0 });

  return (
    <>
      <AppContext.Provider
        value={{
          imageBaseURL: imageBaseURL,
          setImageBaseURL: setImageBaseURL,
          imageRawViewSize: imageRawViewSize,
          dispatchImageRawViewSize: dispatchImageRawViewSize,
          shapePostion: shapePostion,
          dispatchShapePostion: dispatchShapePostion,
        }}
      >
        <div>
          <ApplyImgaeButton />
        </div>
        <div className="canvasArea">
          <ViewImage />
          <EditArea />
        </div>
      </AppContext.Provider>
    </>
  );
};

export default App;
