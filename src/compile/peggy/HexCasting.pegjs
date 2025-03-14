Start = __ exprs:TopLevel|.., NEWLINE |  __ { return exprs }

TopLevel
  = DefineIota
  / DefineFunction
  / UsePatterns

UsePatterns
  = "use" __ '"' filePath:[^"\r\n]+ '"'
  { return { type:"use_pattern", filePath:filePath.join(""), loc:location() }; }

DefineIota
  = "iota" __ id:Identifier __ "=" __ val:Iota
  { return { type:"define_iota", id:id, value:val, loc:location() }; }

DefineFunction
  = "func" __ id:Identifier __ body:FunctionBody
  { return { type:"define_func", id:id, body:body, loc:location() }; }

FunctionBody
  = "{" __ statements:Statement|.., NEWLINE | __ "}"
  { return { type:"function_body", statements:statements, loc:location() }; }


Statement
  = MacroStatement
  / PushStatement
  / CallStatement


PushStatement
  = val:(Iota /('&' ref:Reference {return ref}))
  { return { type:"push_statement", data:val, loc:location() }; }

CallStatement
  = val:Reference
  { return { type:"call_statement", data:val, loc:location() }; }

MacroStatement
  = val:MaskMacro 
  { return { type:"macro_statement", macro:val, loc:location() }; }

MaskMacro 
  = "#mask" _ val:[_*]+
  { return { type:"mask_macro", mode:val.join(""), loc:location() }; }


Reference
  = IdentifierRef
  / PatternRef

IdentifierRef
  = '$' id:Identifier
  { return { type:"ref_id", id:id, loc:location() }; }

PatternRef
  = id:Identifier 
  { return { type:"ref_pattern", id:id, loc:location() }; }

/**
 * iota表达式
 */
Iota
  = DoubleIota
  / BooleanIota
  / NullIota
  / GarbageIota
  / ListIota
  / Vec3Iota
  / RawPatternIota
  / ExternalIota

DoubleIota
  = val:Double
  { return { type:"double", data:val.value, loc:location() }; }

BooleanIota
  = val:("true" / "false")
  { return { type:"boolean", data:text()==="true", loc:location() }; }

NullIota
  = "null"
  { return { type:"null", data:null, loc:location() }; }

GarbageIota
  = "garbage"
  { return { type:"garbage", data:null, loc:location() }; }

ListIota
  = "["__  val:(Iota/Reference)|.., __ "," __ |  __ "]"
  { return { type:"list", data:val, loc:location() }; }

Vec3Iota
  = "vec<" __ x:Double __ "," __ y:Double __ "," __ z:Double __ ">"
  { return { type:"vec3", data:{x:x.value, y:y.value, z:z.value}, loc:location() }; }
// w:前进，e:右前，d:右后，s:后，a:左后，q:左前
RawPatternIota
  = "`" val:[wedsaq]+ "`"
  { return { type:"raw", data:val.join(""), loc:location() }; }

ExternalIota
  = "<" data:[^>]+ ">"
  { return { type:"external", data:data.join(""), loc:location() }; }

/**
 * 小数，带科学计数法
 */
Double= [+-]? ( 
  [0-9]+ ('.' [0-9]*)?    // 标准小数（如123.45）
  / '.' [0-9]+            // 纯小数（如.45）
)([eE] [+-]? [0-9]+ )?    // 科学计数法部分（如e+10）
{ 
    return {
        value:parseFloat(text()),
        loc:location()
    }
}


/**
 * 标识符
 */
Identifier
  = [0-9a-zA-Z_/]+
  { return { type:"id", data:text(), loc:location() }; }


/**
 * 空白、可换行空白、换行
 */
_ = [ \t]*
__ = ([ \t\r\n] / Comment)*
NEWLINE  
  = ([ \t\r] / Comment)*      // 匹配行首水平空白（不含换行）
    '\n'               // 必须包含至少一个换行符
    ([ \t\n\r] / Comment)*    // 匹配后续任意空白（可含更多换行）


/**
 * 忽略注释
 */
 Comment
  = "//" (![\n\r] .)*
  { return null; }
