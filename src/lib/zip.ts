// ZIP STORE container: PNGs are already compressed; avoid another application dependency.
function crc32(bytes: Uint8Array): number {
  let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;
}
export async function zipFiles(files: { name: string; data: Blob }[]): Promise<Blob> {
  const chunks: BlobPart[]=[],directory: BlobPart[]=[];let offset=0,directorySize=0;
  for(const file of files){
    const name=new TextEncoder().encode(file.name),bytes=new Uint8Array(await file.data.arrayBuffer()),crc=crc32(bytes);
    const local=new Uint8Array(30),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint32(14,crc,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,name.length,true);
    const central=new Uint8Array(46),cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);
    chunks.push(local,name,bytes);directory.push(central,name);offset+=local.length+name.length+bytes.length;directorySize+=central.length+name.length;
  }
  const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,directorySize,true);ev.setUint32(16,offset,true);
  return new Blob([...chunks,...directory,end],{type:'application/zip'});
}
