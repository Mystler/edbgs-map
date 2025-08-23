import { asset } from "$app/paths";

export const DefaultMapFont = asset("/NotoSans-VariableFont_wdth,wght.ttf");

interface PowerData {
  color: string;
}
export const Powers: Record<string, PowerData> = {
  "Aisling Duval": {
    color: "#04b2f7",
  },
  "Archon Delaine": {
    color: "#fe0101",
  },
  "A. Lavigny-Duval": {
    color: "#a002fb",
  },
  "Denton Patreus": {
    color: "#1fd2d3",
  },
  "Edmund Mahon": {
    color: "#01960b",
  },
  "Felicia Winters": {
    color: "#fe9e00",
  },
  "Jerome Archer": {
    color: "#ff00fd",
  },
  "Li Yong-Rui": {
    color: "#00ff7a",
  },
  "Nakato Kaine": {
    color: "#9bfb06",
  },
  "Pranav Antal": {
    color: "#ffff00",
  },
  "Yuri Grom": {
    color: "#f96304",
  },
  "Zemina Torval": {
    color: "#065ff3",
  },
};
