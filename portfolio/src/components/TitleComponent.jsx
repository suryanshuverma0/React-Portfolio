import PropTpyes from "prop-types";
const TitleComponent = ({title}) => {
  return (
    <div>
      <div className="p-8 my-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{title}</h1>
      </div>
    </div>
  );
};

TitleComponent.propTypes = {
         title: PropTpyes.string.isRequired,
}
export default TitleComponent;
