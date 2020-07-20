  import { Component } from '@angular/core';
  import { ToastController } from '@ionic/angular';
  import { HttpClient, HttpHeaders } from '@angular/common/http';

import { saveAs } from 'file-saver'

  @Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
  })
  export class HomePage {

    constructor(public toastController: ToastController,
      public http: HttpClient
    ) {
      
    }

    private codigo=""
    private reservadas = ["ARREGLO", 'CLASE', 'OBJETOS'];
    private simbolo = /[.,:(\-)\n\t ]/;
    private identificador = /^[A-Za-z]+[\w_A-Za_z]+[\w_]*$/;
    private expresionNumero = /^\d{1,4}$/;
    public lexemas=[];
    public cadenaEntrada: string = "";

    async presentToast(resultadoAnalisis) {
      const toast = await this.toastController.create({
        header: 'Resultado',
        message: resultadoAnalisis,
        duration: 4000,
        position: 'bottom',
        buttons: [
          {
            side: 'end',
            text: 'Done',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          }
        ]
      });
      toast.present();
    }

    analizadorLexico(){
      let arregloDeCaracteres=this.cadenaEntrada.split('');
      let palabrita='';
      this.lexemas=[];
      arregloDeCaracteres.forEach(caracter => {
        if(!this.simbolo.test(caracter)){
          palabrita+=caracter;
        }
        else{
          if(palabrita.length!=0){
            if(this.reservadas.indexOf(palabrita)!=-1){
              this.lexemas.push({token:palabrita,value:palabrita,color:'light'});
            }
            else if(this.expresionNumero.test(palabrita)){
              this.lexemas.push({token:'numero',value:palabrita,color:'light'});
            }
            else if(this.identificador.test(palabrita)){
              this.lexemas.push({token:'identificador',value:palabrita,color:'light'});
            }
            
            else{
              this.lexemas.push({token:'ERROR 1',value:palabrita,color:'error'});
            }
          }
          if (caracter==':'){
            this.lexemas.push({token:':',value:':',color:'light'});
          }
          else if(caracter==','){
            this.lexemas.push({token:',',value:',',color:'light'});
          }
          else if(caracter=='.'){
            this.lexemas.push({token:'.',value:'.',color:'light'});
          }
          else if(caracter=='('){
            this.lexemas.push({token:'(',value:'(',color:'light'});
          }
          else if(caracter==')'){
            this.lexemas.push({token:')',value:')',color:'light'});
          }
          else if(caracter=='-'){
            this.lexemas.push({token:'-',value:'-',color:'light'});
          }
          else if(caracter==' '||caracter=='\n'||caracter=='\t'){
          }
          else{
            this.lexemas.push({token:'ERROR 2',value:caracter,color:'error'});
          }
          palabrita=''
        }
      });
      if(palabrita.length!=0){
        if(this.reservadas.indexOf(palabrita)!=-1){
          this.lexemas.push({token:palabrita,value:palabrita,color:'light'});
        }
        else if(this.expresionNumero.test(palabrita)){
          this.lexemas.push({token:'numero',value:palabrita,color:'light'});
        }
        else if(this.identificador.test(palabrita)){
          this.lexemas.push({token:'identificador',value:palabrita,color:'light'});
        }
        else{
          this.lexemas.push({token:'ERROR 3',value:palabrita,color:'error'});
        }
      }

      this.analizadorSintaxis();
    }
    
    analizadorSintaxis(){
      let _lexemas = this.lexemas;
      let tabla=null;
      fetch('../../assets/reglas.json').then(res => res.json())
      .then(json => {
          let terminales=['ARREGLO', 'CLASE', 'OBJETOS',':','(',')','identificador','numero',',', '\.', '\-'];
          let no_terminales=['S','nombre','letras','restoLetras','clase','Atributos','RestoAtributo', 'informacionObjetos', 'restoInfo','variables', 'resto','data','digitoResto', '$'];
          //let terminales=['ARREGLO', 'CLASE', 'OBJETOS',':','(',')','identificador','numero',',', '\-'];
          //let no_terminales=['S','nombre','letras','restoLetras','clase','Atributos','RestoAtributo', 'informacionObjetos', 'var','restoInfoAtributo','numeral', 'restoNumero','RestoObjetos', '$'];
        tabla = json;
        
        let reglas =['S','$'];
        while( reglas[0]!='$'){ 
          let regla=reglas[0]
          let lexema=null;
          try {
            lexema=_lexemas[0].token;
          } catch (error) {
            this.presentToast('ERROR X');
            break
          }

          if (terminales.indexOf(regla)!=-1){
              if (lexema == regla){
                  reglas.shift();
                  _lexemas.shift();
              }
              else{
                  this.presentToast('ERROR Y');
                  break
              }
          }
          else{
              let resultado_consulta = null;
              try{
                resultado_consulta=tabla[regla][lexema];
              }
              catch{
                resultado_consulta=null;
              }
              if (resultado_consulta != null){
                  reglas.shift()
                  if (resultado_consulta.length>0){
                      reglas=resultado_consulta.concat(reglas);
                  }
              }
              else{ 
                this.presentToast('ERROR Z');
                break
              }
          }
          console.log(reglas);
          console.log(_lexemas);
        }
        // console.log(reglas)
        // console.log(_lexemas);
        if(reglas.shift()=='$'){
          this.presentToast('Sintaxis correcta');
        }
        else{
          this.presentToast('Chale, hubo un error');
        }
      });

      this.analizadorSemantico();
    }

    analizadorSemantico(){
      let entrada = this.cadenaEntrada.split(' ');
      let posCLASE= 0;
      let posOBJETOS = 0;
      let posMasObjetos = 0;
      let cuantosObjetos = 0;
      for (let index = 0; index < entrada.length; index++) {
        const element = entrada[index];
        if(element == "CLASE"){
          posCLASE = index;
        }
        if(element == "OBJETOS"){
          posOBJETOS = index;
        }
        if(element == "-"){
          posMasObjetos = index;
          cuantosObjetos++;
        }
      }
      let clasecita = entrada.slice(posCLASE, posOBJETOS);
      let objetitos = entrada.slice(posOBJETOS, entrada.length-1);
      let contadorComasClase=0;
      let contadorComasObjetos=0;
      let rregloAux= []
      let numAtributosObjetos=[]
      let opcion=0;
      cuantosObjetos++;

      //console.log("MUCHO TEXTO "+clasecita);
      //console.log(" Objetos "+objetitos);
      
      if(objetitos.includes("-")){
        opcion=1;
        console.log("Existe mas de un objeto");
        //console.log(" tamaño "+clasecita.length);
        for (let index = 0; index < clasecita.length; index++) {
          const abc = clasecita[index];
          if(abc == ","){
            contadorComasClase++;
          }
        }
        let arreglito = this.separarObjetos(objetitos, rregloAux, cuantosObjetos, numAtributosObjetos);
        let b = 0;
        console.log("comas clase varios objts "+ contadorComasClase)
        for(let i = 0; i < arreglito.length; i++){
          b++;
          contadorComasObjetos = arreglito[i];
          if(contadorComasClase == contadorComasObjetos){
            console.log("SEMANTICA CORRECTA")
            this.presentToast("TODO BIEN, TODO CORRECTO Y YO QUE ME ALEGRO");
          }else if(contadorComasClase > contadorComasObjetos){
            console.log("Hay un error");
            this.presentToast("ERROR SEMANTICO --- Hay mas atributos en la clase que en el objeto "+ b);
            break;
          }else if(contadorComasClase < contadorComasObjetos){
            console.log("Hay un error");
            this.presentToast("ERROR SEMANTICO ---Hay mas atributos en la creacion del objeto " + b);
            break;
          }
        }
      }else{
        opcion=2;
        for (let index = 0; index < clasecita.length; index++) {
          const abc = clasecita[index];
          if(abc == ","){
            contadorComasClase++;
          }
        }
        for (let index = 0; index < objetitos.length; index++) {
          const xyz = objetitos[index];
          if(xyz == ","){
            contadorComasObjetos++;
          }
        }
        if(contadorComasClase == contadorComasObjetos){
          console.log("TODO BIEN, TODO CORRECTO Y YO QUE ME ALEGRO")
        }else if(contadorComasClase > contadorComasObjetos){
          console.log("Hay mas atributos en la clase")
        }else if(contadorComasClase < contadorComasObjetos){
          console.log("Hay mas atributos en la creacion del objeto")
        }
      }
      this.crearCodigo(opcion);
    }

    crearCodigo(opc){
      let entrada = this.cadenaEntrada.split(" ");
      let entrada2 = this.cadenaEntrada.split("");
      if(opc == 1){
        let a=0,b=0,c=0,d=0, cadena='', cadena2='';
        let aux = entrada[2];
        this.codigo+="import numpy\n\n"+aux+" = numpy.array([])\n"
        let aux2 = entrada[5];
        this.codigo+="\nclass " + aux2 + "():"
        for (let index = 0; index < entrada2.length; index++) {
          const element = entrada2[index];
          cadena+=entrada2[index];
          if(element == ")"){
            a = index;
            break;
          }
          if(element == "("){
            b = index+1;
          }
        }
        let atributos = cadena.substring(b, a);
        //console.log(atributos)
        this.codigo+="\n\tdef __init__(self,"+ atributos+"):";
        let auxAT = atributos.split(",");
        let selfs = []
        let comas=0
        for(let i =0; i<auxAT.length;i++){
          if(auxAT[i]==","){
            comas++,
            console.log("ignore una coma");
          }else{
            selfs.push(auxAT[i])
            const vari="\n\t\tself."+auxAT[i]+"="+auxAT[i]
            const retorno = this.pegarCadena(vari)
            this.codigo+=retorno
          }
        }
        let cons = ' """\\ '
        this.codigo+="\n\n\tdef __str__(self):\n\t\treturn"+cons
        for(let i =0; i<selfs.length;i++){
          this.codigo+="\n"+selfs[i]+": {}"
        }
        let cons2 = '\\n'
        let cons3 = '"""'
        this.codigo+=cons2+cons3+".format( "
        
        for(let i =0; i<selfs.length;i++){
          if(i==selfs.length-1){
            const vari="self."+selfs[i]+")\n"
            const retorno = this.pegarCadena(vari)
            this.codigo+=retorno
          }else{
            const vari="self."+selfs[i]+","
            const retorno = this.pegarCadena(vari)
            this.codigo+=retorno
          }
        }
        for (let index = 0; index < entrada.length; index++) {
          const element = entrada[index];
          if(element == "OBJETOS"){
            c = index;
          }
        }
        c=c+2;
        let muchosObjetos = entrada.slice(c, entrada.length);
        let arregloObjetos = []
        let e=0
        for (let index = 0; index < muchosObjetos.length; index++) {
          const element = muchosObjetos[index];
          if(element == "-"){
            d = index
            const sliced = muchosObjetos.slice(e, d)
            e=index+1
            console.log(sliced)
            arregloObjetos.push(sliced)
          }
          if(element == "."){
            d = index
            const sliced = muchosObjetos.slice(e, d)
            console.log(sliced)
            arregloObjetos.push(sliced)
          }
        }
        comas=0
        
        let nombreObjetos=[]
        for (let index = 0; index < arregloObjetos.length; index++) {
          let vari=''

          const element = arregloObjetos[index];
          //console.log(element + " tamaño "+ element.length)
          nombreObjetos.push(element[0])
          for (let index2 = 1; index2 < element.length; index2++) {
            const element2 = element[index2];
            let dato = ''
            let num = 0
            //console.log("------"+element2)
            switch (element2) {
              case ("("):
                vari+=element2
                break;
              case (","):
                vari+=element2
                break;
              case (")"):
                vari+=element2
                break;
              default:
                try {
                  num=parseInt(element2)
                  if(isNaN(num)){
                    vari+="\""+element2+"\"";
                  }else{
                    vari+=num;
                  }
                } catch (error) {
                  vari+="\""+element2+"\"";
                }
                break;
            }
            vari+= dato
            //console.log("esto es vari "+ vari)
          } 
          this.codigo+="\n"+element[0]+"="+aux2+vari
        }
        let agregar = ''
        for (let index = 0; index < nombreObjetos.length; index++) {
          const element = nombreObjetos[index];
          if(index==nombreObjetos.length-1){
            agregar+=element
          }else{
            agregar+=element+","
          }
        }
        this.codigo+="\n\n"+aux+"= numpy.append ("+aux+",["+agregar+"])"
        this.codigo+="\nfor i in "+aux+":\n\tprint(i)\n\tprint(type(i))"
        console.log(this.codigo)
        this.guardarArchivo(aux)
      }else if(opc == 2){

      }
    }

    private guardarArchivo(name) {
      this.presentToast('Descargando archivo '+name+'.py' );
      const blob = new Blob([this.codigo], { type: 'text/plain' });
      saveAs(blob, name+".py");
    }

    pegarCadena(chain){
      let a = chain.split(" ");
      let devuelto=''
      for (let index = 0; index < a.length; index++) {
        const element = a[index];
        devuelto+=element
      }
      return devuelto
    }
    separarObjetos(objetos, arreglo, numero, numAtributos){
      let auxiliar=[]
      let a = 0;
      for (let index = 0; index < objetos.length; index++) {
        const abc = objetos[index];
        if(abc == "-"){
          arreglo.push(index);
          //console.log("indice en arreglo "+index);
        }
      }
      for (let index = 0; index < numero; index++) {
        const aux = objetos.slice(a, arreglo[index])
        a = arreglo[index]
        auxiliar.push(aux)
        //console.log("objeto separado "+aux);
      }
      for (let index = 0; index < auxiliar.length; index++) {
        const efe = auxiliar[index];
        //console.log("aver"+ efe);
        let controlar = 0;
        for (let index2 = 0; index2 < efe.length; index2++) {
          const efe2 = efe[index2];
          if(efe2 == ","){
            controlar++;
          }
        }
        numAtributos.push(controlar);
        console.log("Atributos en objeto= " + controlar)
      }
      return numAtributos;
    }



    limpiar(){
      this.cadenaEntrada="";
      this.codigo="";
      this.lexemas=[];
    }

  }
