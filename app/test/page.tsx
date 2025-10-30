export default function TestPage(){
  return (
    <main className="p-6">
      <h1 style={{fontWeight:700, fontSize:20, marginBottom:12}}>Region Image Fill Test</h1>
      <p style={{marginBottom:12}}>일본 지역 SVG에 /images/pref/*.jpg 이미지를 패턴으로 채워서 보여줍니다. (index.json에 있는 키만 적용)</p>
      <div style={{border:"1px solid #ddd", borderRadius:12, overflow:"hidden"}}>
        {/* The viewer page /map/jpn 에서도 동작합니다. */}
        <iframe src="/map/jpn" style={{width:"100%", height:800, border:"0"}} />
      </div>
    </main>
  );
}