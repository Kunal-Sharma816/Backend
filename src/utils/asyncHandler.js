const asyncHandler = (requestHandler) => {
    (req, res , next)=>
    {
        Promise.resolve(requestHandler(req  , res , next)).catch((err)=>next(err))
    }
}

export {asyncHandler}


// how i made higher-order-function

// const asyncHandler = ()=>{}
// const asyncHandler = (func)=> {()=>{}}
// const asyncHandler = (func)=> async () => {}


// method -1 which uses try-catch 

// const asyncHandler = (fn) => async(req , res , next) => {
//     try {

//         await fn(req , res , next)
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
