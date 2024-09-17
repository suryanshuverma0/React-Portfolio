import PropTypes from "prop-types";
const ServicesCard = ({title , description,icon}) => {
  return (
    <>
     <div className="flex flex-col justify-end items-center gap-2 shadow-xl dark:shadow-glow text-black dark:text-white bg-gray-200 dark:bg-neutral-900 w-8/10 h-48">
         <span className="pt-2">{icon}</span>
         <h1 className="text-2xl font-bold">{title}</h1>
         <p className="pb-2 text-center p-4">{description}</p>
         </div> 
    </>
  )
}
ServicesCard.propTypes = {
         title: PropTypes.string.isRequired,
         description: PropTypes.string.isRequired,
         icon: PropTypes.element.isRequired,
}
export default ServicesCard
