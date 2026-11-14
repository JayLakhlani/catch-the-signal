// Input state shared by keyboard and pointer controls. A held contact cannot repeat.
export function createResponseController({now,onPress,onCancel=()=>{}}){
 let mode='pointer',keyHeld=false,pointerId=null;
 return {
  setMode(value){if(!['pointer','keyboard'].includes(value))throw Error('invalid_input_mode');mode=value;this.reset();},
  get held(){return keyHeld||pointerId!==null;},
  reset(){keyHeld=false;pointerId=null;},
  keyDown(e){if(mode!=='keyboard'||e.code!=='Space')return false;if(!e.repeat&&!keyHeld){keyHeld=true;onPress('keyboard',now());}return true;},
  keyUp(e){if(e.code==='Space')keyHeld=false;},
  pointerDown(e){if(mode!=='pointer'||e.isPrimary===false||e.button!==0||pointerId!==null||!['touch','mouse','pen'].includes(e.pointerType))return false;pointerId=e.pointerId;onPress(e.pointerType,now());return true;},
  pointerUp(e){if(e.pointerId===pointerId)pointerId=null;},
  pointerCancel(e){if(e.pointerId===pointerId){pointerId=null;onCancel();}}
 };
}
